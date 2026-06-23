import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      id,
      userId: session.user.id,
      organizationId: session.user.organizationId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
