import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

const TYPES = ["CALL", "MEETING", "EMAIL", "FOLLOW_UP", "TASK", "NOTE"] as const;
const STATUSES = ["PLANNED", "COMPLETED", "CANCELLED", "OVERDUE"] as const;

const createSchema = z
  .object({
    type: z.enum(TYPES),
    subject: z.string().min(1),
    description: z.string().optional().nullable(),
    dueAt: z.string().optional().nullable(),
    status: z.enum(STATUSES).default("PLANNED"),
    data: z.record(z.unknown()).optional().nullable(),
    leadId: z.string().optional().nullable(),
    opportunityId: z.string().optional().nullable(),
  })
  .refine((d) => !!d.leadId !== !!d.opportunityId, {
    message: "An activity must be linked to exactly one of a lead or an opportunity",
  });

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const leadId = sp.get("leadId");
  const opportunityId = sp.get("opportunityId");
  if (!leadId && !opportunityId) return NextResponse.json({ error: "leadId or opportunityId required" }, { status: 400 });
  const activities = await prisma.activity.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(leadId ? { leadId } : {}),
      ...(opportunityId ? { opportunityId } : {}),
    },
    include: { owner: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ activities });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.organizationId;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  const d = parsed.data;

  // Multi-tenant guard: the linked entity must belong to this org.
  if (d.leadId) {
    const ok = await prisma.lead.findFirst({ where: { id: d.leadId, organizationId: orgId }, select: { id: true } });
    if (!ok) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (d.opportunityId) {
    const ok = await prisma.opportunity.findFirst({ where: { id: d.opportunityId, organizationId: orgId }, select: { id: true } });
    if (!ok) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  const activity = await prisma.activity.create({
    data: {
      organizationId: orgId,
      type: d.type,
      subject: d.subject,
      description: d.description ?? null,
      dueAt: d.dueAt ? new Date(d.dueAt) : null,
      status: d.status,
      completedAt: d.status === "COMPLETED" ? new Date() : null,
      data: (d.data as object) ?? undefined,
      ownerId: session.user.id,
      leadId: d.leadId ?? null,
      opportunityId: d.opportunityId ?? null,
    },
    include: { owner: { select: { name: true, image: true } } },
  });

  await recordAudit({
    organizationId: orgId,
    entityType: d.opportunityId ? "OPPORTUNITY" : "LEAD",
    entityId: (d.opportunityId ?? d.leadId)!,
    action: "UPDATED",
    summary: `Logged ${d.type.toLowerCase().replace("_", " ")} · ${d.subject}`,
    actorId: session.user.id,
    actorName: session.user.name,
  });

  return NextResponse.json({ activity });
}

const patchSchema = z.object({ id: z.string().min(1), status: z.enum(STATUSES) });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const row = await prisma.activity.findFirst({
    where: { id: parsed.data.id, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const activity = await prisma.activity.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
    },
    include: { owner: { select: { name: true, image: true } } },
  });
  return NextResponse.json({ activity });
}
