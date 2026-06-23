import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  identifier: z.string().min(3),
  code: z.string().min(4).max(8),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { identifier, code, password } = parsed.data;

  const token = await prisma.otpToken.findFirst({
    where: {
      identifier,
      consumed: false,
      expires: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!token) {
    return NextResponse.json({ error: "Code is invalid or expired" }, { status: 400 });
  }

  const ok = await bcrypt.compare(code, token.code);
  if (!ok) {
    return NextResponse.json({ error: "Code is invalid or expired" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { mobile: identifier }],
    },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.otpToken.update({
      where: { id: token.id },
      data: { consumed: true },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
