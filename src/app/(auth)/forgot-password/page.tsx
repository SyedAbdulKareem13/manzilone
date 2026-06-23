"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/otp/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: String(form.get("email")), channel: "EMAIL" }),
    });
    setSent(true);
    toast.success("Reset link sent if the email exists");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md luxury-card p-8"
    >
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Forgot password?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send instructions to reset your password.
      </p>
      {sent ? (
        <div className="mt-6 rounded-xl border bg-success/10 p-4 text-sm">
          If an account with that email exists, you&apos;ll receive a reset link shortly.
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handle}>
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" name="email" type="email" required className="pl-9" />
            </div>
          </div>
          <Button type="submit" variant="gradient" size="lg" className="w-full">
            Send reset instructions
          </Button>
        </form>
      )}
    </motion.div>
  );
}
