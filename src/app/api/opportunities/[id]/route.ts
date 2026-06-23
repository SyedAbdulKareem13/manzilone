import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().optional(),
  customerId: z.string().optional(),
  expectedRevenue: z.coerce.number().nonnegative().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  stage: z
    .enum([
      "QUALIFICATION", "DISCOVERY", "REQUIREMENT_ANALYSIS", "PROPOSAL_SUBMITTED",
      "RFQ_RECEIVED", "QUOTATION_SENT", "NEGOTIATION", "MANAGEMENT_APPROVAL",
      "VERBAL_CONFIRMATION", "WON", "LOST",
    ])
    .optional(),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const stageChanged = parsed.data.stage !== undefined;
  const updated = await prisma.opportunity.update({
    where: { id, organizationId: session.user.organizationId },
    data: {
      ...parsed.data,
      expectedCloseDate: parsed.data.expectedCloseDate ? new Date(parsed.data.expectedCloseDate) : undefined,
      ...(stageChanged ? { stageEnteredAt: new Date() } : {}),
    },
  });

  if (stageChanged) {
    await prisma.notification.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        type: "STAGE_CHANGE",
        title: `${updated.oppNumber} moved to ${updated.stage}`,
        url: `/app/opportunities/${updated.id}`,
      },
    }).catch(() => null);
  }

  return NextResponse.json({ opportunity: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.opportunity.delete({
    where: { id, organizationId: session.user.organizationId },
  });
  return NextResponse.json({ ok: true });
}
