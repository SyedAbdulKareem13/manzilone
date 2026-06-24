"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RELEASES, CURRENT_VERSION, type ChangeType } from "@/lib/releases";
import { formatDate } from "@/lib/utils";

const KEY = "manzil:lastSeenVersion";

const TYPE_META: Record<ChangeType, { label: string; variant: any }> = {
  new: { label: "New", variant: "soft" },
  improved: { label: "Improved", variant: "info" },
  fixed: { label: "Fixed", variant: "success" },
};

export function WhatsNew() {
  const latest = RELEASES[0];
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(KEY);
      if (seen !== CURRENT_VERSION) {
        setUnseen(true);
        setOpen(true); // auto-show once per new version
      }
    } catch {
      /* ignore */
    }
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(KEY, CURRENT_VERSION);
    } catch {
      /* ignore */
    }
    setUnseen(false);
  }

  function dismiss() {
    markSeen();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="What's new"
        className="relative grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Sparkles className="h-4 w-4" />
        {unseen ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">What's new in Manzil One</DialogTitle>

          <div className="btn-gradient px-6 py-5 text-white">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/85">
              <Sparkles className="h-3.5 w-3.5" /> What's new
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold tracking-tight">v{latest.version}</span>
              <span className="text-sm text-white/90">· {latest.title}</span>
            </div>
            <div className="mt-0.5 text-xs text-white/75">{formatDate(latest.date)}</div>
          </div>

          <div className="max-h-[48vh] overflow-y-auto px-6 py-4 scrollbar-thin">
            <ul className="space-y-2.5">
              {latest.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Badge variant={TYPE_META[it.type].variant} className="mt-0.5 shrink-0">
                    {TYPE_META[it.type].label}
                  </Badge>
                  <span className="text-foreground/85">{it.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t px-6 py-3">
            <Link
              href="/app/releases"
              onClick={dismiss}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              All release notes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Button variant="gradient" size="sm" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
