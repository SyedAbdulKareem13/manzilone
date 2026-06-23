import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ~1.5MB cap on the image string (data URLs are base64-inflated by ~33%).
const MAX_IMAGE_LENGTH = 1_500_000;

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  mobile: z
    .string()
    .max(32)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
  image: z
    .string()
    .max(MAX_IMAGE_LENGTH, "Image is too large")
    .refine(
      (v) => v.startsWith("data:image/") || /^https?:\/\//.test(v),
      "Image must be a data URL or http(s) URL"
    )
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  // Drop keys that weren't provided so we never overwrite with undefined.
  const updateData: { name?: string; mobile?: string | null; image?: string | null } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.mobile !== undefined) updateData.mobile = data.mobile;
  if (data.image !== undefined) updateData.image = data.image;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      mobile: true,
      role: true,
    },
  });

  return NextResponse.json({ user });
}
