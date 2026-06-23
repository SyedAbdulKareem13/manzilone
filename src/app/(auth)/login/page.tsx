import { Suspense } from "react";
import { LoginCard } from "./login-card";

export const metadata = { title: "Sign in — Nova CRM" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[420px] w-full max-w-5xl animate-pulse rounded-3xl bg-muted/40" />}>
      <LoginCard />
    </Suspense>
  );
}
