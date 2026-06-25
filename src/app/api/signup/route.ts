import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().min(2),
  companyName: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(7).optional(),
  password: z.string().min(6),
  code: z.string().min(4).max(8),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { fullName, companyName, email, mobile, password, code } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  // Verify the email OTP before creating anything.
  const token = await prisma.otpToken.findFirst({
    where: { identifier: email, channel: "EMAIL", consumed: false, expires: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token || !(await bcrypt.compare(code, token.code))) {
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
  }
  await prisma.otpToken.update({ where: { id: token.id }, data: { consumed: true } });

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = `${slugify(companyName)}-${Math.random().toString(36).slice(2, 6)}`;

  const org = await prisma.organization.create({
    data: { name: companyName, slug, currency: "INR" },
  });

  const user = await prisma.user.create({
    data: {
      email,
      name: fullName,
      mobile,
      passwordHash,
      role: "ADMIN",
      organizationId: org.id,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true, userId: user.id, orgId: org.id });
}
