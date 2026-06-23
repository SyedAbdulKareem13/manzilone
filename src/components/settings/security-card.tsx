"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SecurityCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("New passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't update password");
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <CardTitle>Security</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                className="pl-9"
                placeholder="Leave blank if you signed up with Google"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="pl-9"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="pl-9"
                placeholder="Re-enter new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" variant="gradient" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
