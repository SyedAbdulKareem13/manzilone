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
  const { fullName, companyName, email, mobile, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

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
