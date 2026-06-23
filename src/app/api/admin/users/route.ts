import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES = [
  "ADMIN",
  "SALES_EXEC",
  "SALES_MANAGER",
  "BUSINESS_HEAD",
  "FINANCE",
  "REVENUE_OWNER",
  "VIEWER",
] as const;

const patchSchema = z.object({
  id: z.string().min(1),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
  });
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { id, role, isActive } = parsed.data;
  if (role === undefined && isActive === undefined)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  // Ensure the target user belongs to the same org (multi-tenant guard).
  const target = await prisma.user.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(role !== undefined ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
  });
  return NextResponse.json({ user });
}
