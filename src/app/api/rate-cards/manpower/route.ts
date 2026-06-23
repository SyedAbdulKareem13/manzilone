import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  designation: z.string().min(1),
  experience: z.string().min(1),
  grade: z.string().optional(),
  location: z.string().optional(),
  hourlyRate: z.coerce.number().nonnegative(),
  dailyRate: z.coerce.number().nonnegative(),
  monthlyRate: z.coerce.number().nonnegative(),
  currency: z.string().default("INR"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const card = await prisma.manpowerRateCard.create({
    data: { ...parsed.data, organizationId: session.user.organizationId },
  });
  return NextResponse.json({ card });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.manpowerRateCard.delete({ where: { id, organizationId: session.user.organizationId } });
  return NextResponse.json({ ok: true });
}
