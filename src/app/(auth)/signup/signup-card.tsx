"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Building2, Mail, Lock, Phone, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Form = {
  fullName: string;
  companyName: string;
  email: string;
  mobile: string;
  password: string;
  confirm: string;
};

const EMPTY: Form = { fullName: "", companyName: "", email: "", mobile: "", password: "", confirm: "" };

export function SignupCard() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [form, setForm] = useState<Form>(EMPTY);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function sendCode(): Promise<boolean> {
    const res = await fetch("/api/otp/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: form.email, channel: "EMAIL", purpose: "signup" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't send the code");
      return false;
    }
    if (data.mock && data.code) {
      setCode(data.code);
      toast.message("Verification code (dev)", { description: `Use ${data.code}` });
    } else {
      toast.success(`Verification code sent to ${form.email}`);
    }
    return true;
  }

  async function handleDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      if (await sendCode()) setStep("verify");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          companyName: form.companyName,
          email: form.email,
          mobile: form.mobile || undefined,
          password: form.password,
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Signup failed");
      toast.success("Email verified — account created");
      await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      router.push("/app");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full max-w-xl luxury-card p-8"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === "details"
          ? "Free 14-day trial. We'll verify your email with a one-time code."
          : "Enter the 6-digit code we sent to verify your email."}
      </p>

      <AnimatePresence mode="wait">
        {step === "details" ? (
          <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button variant="glass" className="mt-6 w-full" onClick={() => signIn("google", { callbackUrl: "/app" })}>
              Continue with Google
            </Button>
            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={handleDetails} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field icon={<User className="h-4 w-4" />} label="Full name" value={form.fullName} onChange={set("fullName")} required />
              <Field icon={<Building2 className="h-4 w-4" />} label="Company name" value={form.companyName} onChange={set("companyName")} required />
              <Field icon={<Mail className="h-4 w-4" />} label="Work email" type="email" value={form.email} onChange={set("email")} required className="sm:col-span-2" />
              <Field icon={<Phone className="h-4 w-4" />} label="Mobile" value={form.mobile} onChange={set("mobile")} />
              <Field icon={<Lock className="h-4 w-4" />} label="Password" type="password" value={form.password} onChange={set("password")} required />
              <Field icon={<Lock className="h-4 w-4" />} label="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} required className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Sending code…" : "Continue — verify email"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.form
            key="verify"
            onSubmit={handleVerify}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center gap-2 rounded-xl border bg-primary/5 px-3 py-2.5 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Code sent to <span className="font-medium">{form.email}</span>
            </div>
            <div>
              <Label htmlFor="code">6-digit code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="••••••"
                className="mt-1.5 text-center text-lg tracking-[0.5em]"
              />
            </div>
            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
              {loading ? "Verifying…" : "Verify & create account"}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => setStep("details")}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => sendCode()}>
                Resend code
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already on Manzil One?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

function Field({
  label,
  icon,
  className,
  type = "text",
  required,
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input type={type} required={required} value={value} onChange={onChange} className="pl-9" />
      </div>
    </div>
  );
}
