/**
 * Transactional email. Uses Resend when RESEND_API_KEY is set (no SDK needed —
 * plain fetch). Falls back to a no-op (dev) when unconfigured, in which case
 * the OTP is surfaced in-app instead so flows are never blocked.
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; provider: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.OTP_FROM_EMAIL || "Manzil One <onboarding@resend.dev>";

  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("Resend send failed", res.status, body);
        return { ok: false, provider: "resend" };
      }
      return { ok: true, provider: "resend" };
    } catch (e) {
      console.error("sendMail error", e);
      return { ok: false, provider: "resend" };
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[email:mock] to=${opts.to} subject="${opts.subject}"`);
  }
  return { ok: false, provider: "mock" };
}

/** Branded OTP email (inline styles for email-client compatibility). */
export function otpEmailHtml(code: string, purpose: "verify your email" | "reset your password" | "sign in"): string {
  return `<!doctype html>
<html><body style="margin:0;background:#FAFAF7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#0F1014;">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
    <div style="background:#14151A;border-radius:18px;padding:28px 28px 24px;color:#fff;">
      <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#A3A7B0;font-weight:700;">Manzil One · CRM Suite</div>
      <div style="margin-top:14px;font-size:18px;font-weight:600;">Your verification code</div>
      <div style="margin-top:4px;font-size:13px;color:#A3A7B0;">Use this code to ${purpose}.</div>
      <div style="margin:22px 0;background:linear-gradient(135deg,#FF6B6B,#F44848);border-radius:14px;padding:18px;text-align:center;">
        <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:#fff;">${code}</span>
      </div>
      <div style="font-size:12px;color:#A3A7B0;">This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.</div>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:11px;color:#A3A7B0;">© Manzil One — منزل ون</div>
  </div>
</body></html>`;
}
