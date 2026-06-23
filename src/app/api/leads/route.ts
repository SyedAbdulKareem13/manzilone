import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextLeadNumber } from "@/lib/numbering";

const createSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  mobile: z.string().optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "EMAIL_CAMPAIGN", "EVENT", "PARTNER", "SOCIAL", "OTHER"]).default("WEBSITE"),
  industry: z.string().optional(),
  notes: z.string().optional(),
  expectedRevenue: z.coerce.number().nonnegative().optional(),
  territoryId: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status") ?? undefined;
  const leads = await prisma.lead.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(status ? { status: status as any } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { leadNumber: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, image: true } } },
    take: 200,
  });
  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const orgId = session.user.organizationId;
  const leadNumber = await nextLeadNumber(orgId);
  const lead = await prisma.lead.create({
    data: {
      ...parsed.data,
      leadNumber,
      organizationId: orgId,
      ownerId: session.user.id,
    },
  });
  return NextResponse.json({ lead });
}
