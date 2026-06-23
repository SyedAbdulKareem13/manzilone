import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh" />
      <div className="pointer-events-none absolute -top-32 -left-32 -z-10 h-[480px] w-[480px] rounded-full bg-gradient-luxury opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 -z-10 h-[480px] w-[480px] rounded-full bg-gradient-aurora opacity-25 blur-3xl animate-aurora" />

      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-luxury text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg">
            Nova <span className="text-gradient">CRM</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Need help?
        </Link>
      </header>
      <main className="container flex min-h-[calc(100vh-120px)] items-center justify-center pb-12">
        {children}
      </main>
    </div>
  );
}
