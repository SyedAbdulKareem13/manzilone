import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 5 * 60 * 1000;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueOtp(opts: {
  identifier: string;
  channel: "EMAIL" | "SMS";
  userId?: string | null;
}) {
  const code = generateOtp();
  const hashed = await bcrypt.hash(code, 8);
  await prisma.otpToken.create({
    data: {
      identifier: opts.identifier,
      channel: opts.channel,
      code: hashed,
      expires: new Date(Date.now() + OTP_TTL_MS),
      userId: opts.userId ?? undefined,
    },
  });
  // In production, wire to SES / SendGrid / MSG91 / Twilio.
  // In dev, return the raw code so the UI can show it (only when OTP_PROVIDER=mock).
  if (process.env.OTP_PROVIDER === "mock" || process.env.NODE_ENV !== "production") {
    return { code, mock: true as const };
  }
  return { code: null, mock: false as const };
}
