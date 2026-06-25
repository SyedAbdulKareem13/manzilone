import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendMail, emailConfigured, otpEmailHtml } from "@/lib/email";

const OTP_TTL_MS = 5 * 60 * 1000;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

type Purpose = "verify your email" | "reset your password" | "sign in";

export async function issueOtp(opts: {
  identifier: string;
  channel: "EMAIL" | "SMS";
  userId?: string | null;
  purpose?: Purpose;
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

  let delivered = false;
  if (opts.channel === "EMAIL" && opts.identifier.includes("@") && emailConfigured()) {
    const r = await sendMail({
      to: opts.identifier,
      subject: "Your Manzil One verification code",
      html: otpEmailHtml(code, opts.purpose ?? "verify your email"),
      text: `Your Manzil One verification code is ${code}. It expires in 5 minutes.`,
    });
    delivered = r.ok;
  }

  // When no real email provider is configured we return the code so the UI can
  // show it (keeps dev / demo usable). With a provider, the code goes to email only.
  const expose = !emailConfigured();
  return { code: expose ? code : null, mock: expose, delivered };
}
