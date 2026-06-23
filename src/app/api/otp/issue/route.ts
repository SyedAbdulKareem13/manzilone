import { NextResponse } from "next/server";
import { issueOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  identifier: z.string().min(3),
  channel: z.enum(["EMAIL", "SMS"]).default("EMAIL"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: parsed.data.identifier },
        { mobile: parsed.data.identifier },
      ],
    },
    select: { id: true },
  });
  const result = await issueOtp({
    identifier: parsed.data.identifier,
    channel: parsed.data.channel,
    userId: user?.id ?? null,
  });
  // In dev/mock mode we return the code so the form can fill it.
  return NextResponse.json({ ok: true, mock: result.mock, code: result.code });
}
