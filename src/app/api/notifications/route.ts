import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        readAt: null,
      },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

const postSchema = z.object({
  action: z.literal("markAllRead"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
