"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  WandSparkles,
  ArrowUp,
  ArrowRight,
  Send,
  FileText,
  Building2,
  Mail,
  ReceiptText,
  MessageSquare,
  Copy,
  Check,
  AlertTriangle,
  TrendingUp,
  TriangleAlert,
  CircleCheck,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- *
 * Scoped Manz AI animations + signature coral accents.
 * Keyframes ported from the AI-workspace design handoff (orbDrift,
 * haloSpin, riseIn, particleRise, dotPulse, growBar, drawW, phRotate,
 * floatY), rebranded to Manz AI and mapped onto the app's theme tokens
 * (primary + chart-1..5) so it adapts in light / dark / graphite —
 * the Platinum default maps to the design's coral.
 * NOTE: this string MUST NOT contain backticks / ${} inside.
 * ---------------------------------------------------------------- */
const MANZ_CSS = [
  "@keyframes manz-orbDrift{0%{transform:scale(1) translate(0,0) rotate(0)}50%{transform:scale(1.14) translate(2px,-2px) rotate(42deg)}100%{transform:scale(1.06) translate(-2px,2px) rotate(-32deg)}}",
  "@keyframes manz-haloSpin{to{transform:rotate(360deg)}}",
  "@keyframes manz-riseIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}",
  "@keyframes manz-floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}",
  "@keyframes manz-particleRise{0%{opacity:0;transform:translateY(16px) scale(.6)}14%{opacity:.85}100%{opacity:0;transform:translateY(-96px) scale(.2)}}",
  "@keyframes manz-dotPulse{0%{box-shadow:0 0 0 0 hsl(var(--primary)/.45)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}",
  "@keyframes manz-drawW{from{transform:scaleX(0)}to{transform:scaleX(1)}}",
  "@keyframes manz-growBar{from{transform:scaleY(0)}to{transform:scaleY(1)}}",
  "@keyframes manz-phRotate{0%,15%{transform:translateY(0)}20%,35%{transform:translateY(-26px)}40%,55%{transform:translateY(-52px)}60%,75%{transform:translateY(-78px)}80%,100%{transform:translateY(-104px)}}",
  "@keyframes manz-blink{0%,100%{opacity:1}50%{opacity:0}}",
  ".manz-orb{position:relative;border-radius:24px;overflow:hidden;background:radial-gradient(120% 120% at 30% 25%,hsl(var(--card)) 0%,hsl(var(--primary)/.14) 58%,hsl(var(--chart-1)/.22) 100%);box-shadow:inset 0 0 0 1px hsl(var(--primary)/.22);}",
  ".manz-orb-blob{position:absolute;inset:0;background:radial-gradient(40% 40% at 30% 30%,hsl(var(--chart-1)),transparent 70%),radial-gradient(50% 50% at 70% 60%,hsl(var(--chart-5)),transparent 70%),radial-gradient(60% 60% at 50% 80%,hsl(var(--primary)),transparent 70%),radial-gradient(42% 42% at 80% 22%,hsl(var(--chart-2)),transparent 70%);filter:blur(9px) saturate(150%);animation:manz-orbDrift 7s ease-in-out infinite alternate;}",
  ".manz-orb-spec{position:absolute;left:16%;top:13%;width:32%;height:18%;border-radius:50%;background:linear-gradient(180deg,hsl(0 0% 100%/.85),hsl(0 0% 100%/0));filter:blur(.5px);}",
  ".manz-halo{position:relative;}",
  ".manz-halo::before{content:'';position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--manz-a,0deg),hsl(var(--primary)),hsl(var(--chart-1)),hsl(var(--chart-2)),hsl(var(--chart-5)),hsl(var(--primary)));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;opacity:.34;animation:manz-haloSpin 11s linear infinite;pointer-events:none;}",
  ".manz-aurora{background:linear-gradient(100deg,hsl(var(--chart-1)),hsl(var(--chart-5)),hsl(var(--primary)),hsl(var(--chart-1)));background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}",
  ".manz-rise{animation:manz-riseIn .58s cubic-bezier(.2,.9,.25,1.05) both;}",
  ".manz-bar{transform-origin:bottom;animation:manz-growBar .8s cubic-bezier(.2,.9,.25,1.05) both;}",
  ".manz-draw{transform-origin:left;animation:manz-drawW .9s cubic-bezier(.2,.9,.25,1.05) both;}",
  ".manz-dot{animation:manz-dotPulse 2.2s ease-out infinite;}",
  ".manz-caret{animation:manz-blink 1s step-end infinite;}",
  "@media (prefers-reduced-motion: reduce){.manz-orb-blob,.manz-halo::before,.manz-rise,.manz-bar,.manz-draw,.manz-dot,.manz-float,.manz-caret,.manz-particle,.manz-ph{animation:none !important;}.manz-bar{transform:none !important}.manz-draw{transform:none !important}}",
].join("\n");

/* ============================ Types ============================== */
type Mode = "hub" | "chat" | "rfq" | "quote" | "company" | "email";
type AiError = { message: string; code?: string };

const TOOLS: {
  id: Mode;
  label: string;
  kicker: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string; // hsl token for the icon tile
  blurb: string;
}[] = [
  {
    id: "chat",
    label: "Ask Manz AI",
    kicker: "CONVERSATION",
    icon: MessageSquare,
    tint: "var(--primary)",
    blurb: "Chat with your pipeline in plain language. Manz AI reasons over every opportunity, account and activity.",
  },
  {
    id: "rfq",
    label: "RFQ Parser",
    kicker: "STRUCTURE",
    icon: FileText,
    tint: "var(--chart-2)",
    blurb: "Paste an RFQ email or document and Manz AI extracts clean, structured line items ready to action.",
  },
  {
    id: "quote",
    label: "Quote Drafter",
    kicker: "PRICING",
    icon: ReceiptText,
    tint: "var(--chart-4)",
    blurb: "Turn a short brief into scope, assumptions, suggested line items and a pricing note.",
  },
  {
    id: "company",
    label: "Company Lookup",
    kicker: "SALES INTEL",
    icon: Building2,
    tint: "var(--chart-3)",
    blurb: "Get an AI overview, what they do and sharp talking points before your next call.",
  },
  {
    id: "email",
    label: "Email Writer",
    kicker: "WRITING",
    icon: Mail,
    tint: "var(--chart-5)",
    blurb: "Generate follow-ups and outreach in your tone, grounded in the deal's real context.",
  },
];

/* ============================ Networking ========================= */
async function callAI<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: AiError = { message: data?.error ?? "Manz AI request failed.", code: data?.code };
    throw err;
  }
  return data as T;
}

/* ============================ Insights parsing =================== */
type Insight = {
  kind: "risk" | "momentum" | "forecast";
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string; // hsl token
  title: string;
  detail: string;
  viz: "bars" | "ring" | "bars2";
  value?: number; // for ring
};

function parseNumber(raw: string): number | null {
  const m = raw.match(/[\d.,]+/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Build the "What Manz AI noticed" feed from the live context string
 * (" · "-separated label/value pairs, e.g. pipeline / active / won /
 * leads). Never invents company names — derives from context or keeps
 * generic, and falls back to a single generic card when empty.
 */
function buildInsights(context: string): Insight[] {
  const parts = context
    .split(" · ")
    .map((p) => p.trim())
    .filter(Boolean);

  // Map raw context segments to a lookup by keyword.
  const find = (kw: RegExp): string | null => parts.find((p) => kw.test(p)) ?? null;

  const pipeline = find(/pipeline|value/i);
  const active = find(/active|open|opp/i);
  const won = find(/won/i);
  const leads = find(/lead/i);

  const out: Insight[] = [];

  if (pipeline) {
    out.push({
      kind: "forecast",
      label: pipeline,
      badge: "PIPELINE",
      icon: TrendingUp,
      tint: "var(--chart-5)",
      title: pipeline,
      detail: "Total value currently moving through your pipeline. Ask Manz AI to break it down by stage or owner.",
      viz: "bars2",
    });
  }

  if (active) {
    const n = parseNumber(active);
    out.push({
      kind: "momentum",
      label: active,
      badge: "MOMENTUM",
      icon: CircleCheck,
      tint: "var(--success)",
      title: active,
      detail: "Live opportunities Manz AI is tracking. Ask which ones are most likely to slip — and why.",
      viz: "ring",
      value: n != null ? Math.min(99, Math.max(8, Math.round((n % 90) + 8))) : 72,
    });
  }

  if (won) {
    out.push({
      kind: "forecast",
      label: won,
      badge: "FORECAST",
      icon: TrendingUp,
      tint: "var(--chart-1)",
      title: won,
      detail: "Closed-won so far. Manz AI can pace this against your target and flag what moves the number most.",
      viz: "bars",
    });
  }

  if (leads && out.length < 3) {
    out.push({
      kind: "risk",
      label: leads,
      badge: "ATTENTION",
      icon: TriangleAlert,
      tint: "var(--primary)",
      title: leads,
      detail: "New leads waiting on first touch. Ask Manz AI who you haven't followed up with yet.",
      viz: "bars",
    });
  }

  // Generic fallback so the feed is never empty.
  if (out.length === 0) {
    out.push({
      kind: "momentum",
      label: "Workspace ready",
      badge: "READY",
      icon: Sparkles,
      tint: "var(--primary)",
      title: "Manz AI is connected to your workspace.",
      detail: "Ask anything about your pipeline, draft outreach, parse an RFQ or get pricing guidance.",
      viz: "ring",
      value: 88,
    });
  }

  return out.slice(0, 3);
}

/* ============================ Small UI =========================== */
function Orb({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) {
  const radius = Math.round(size * 0.3);
  return (
    <div
      className={cn("manz-orb shrink-0", className)}
      style={{ width: size, height: size, borderRadius: radius, ...style }}
      aria-hidden
    >
      <div className="manz-orb-blob" />
      <div className="manz-orb-spec" />
    </div>
  );
}

function ErrorNote({ err }: { err: AiError }) {
  const quota = err.code === "rate_limited";
  const cfg = err.code === "not_configured";
  const headline = quota
    ? "Manz AI is rate-limited — check the Gemini quota."
    : cfg
      ? "Manz AI isn't configured yet."
      : err.message;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <div className="font-medium">{headline}</div>
        {quota ? (
          <div className="mt-1 text-xs text-muted-foreground">
            Enable the free tier / billing for the Gemini API on your Google AI Studio project, then retry.
          </div>
        ) : cfg ? (
          <div className="mt-1 text-xs text-muted-foreground">
            Set <code className="font-mono">GEMINI_API_KEY</code> in the environment.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1400);
          });
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Thinking({ label = "Thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="manz-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
      <span className="manz-aurora font-medium">{label}…</span>
    </div>
  );
}

const reveal = {
  initial: { opacity: 0, y: 14, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

/* ============================== Root ============================== */
export function AiStudioClient({
  configured,
  context,
  userName,
}: {
  configured: boolean;
  context: string;
  userName: string | null;
}) {
  const [mode, setMode] = React.useState<Mode>("hub");
  // The chat surface seeds itself from a hub prompt via this ref.
  const seedRef = React.useRef<string | null>(null);

  const goChat = React.useCallback((seed?: string) => {
    seedRef.current = seed ?? null;
    setMode("chat");
  }, []);

  return (
    <div className="relative">
      <style>{MANZ_CSS}</style>

      {/* Segmented control: Hub + tools */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <ModeTab active={mode === "hub"} onClick={() => setMode("hub")} icon={Sparkles} label="Home" />
        {TOOLS.map((t) => (
          <ModeTab key={t.id} active={mode === t.id} onClick={() => setMode(t.id)} icon={t.icon} label={t.label} />
        ))}
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          <span
            className="manz-dot h-1.5 w-1.5 rounded-full bg-success"
            style={{ boxShadow: "0 0 0 3px hsl(var(--success)/.22)" }}
          />
          Powered by Gemini
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={mode} {...reveal}>
          {mode === "hub" && <Hub configured={configured} context={context} userName={userName} setMode={setMode} goChat={goChat} />}
          {mode === "chat" && <Chat configured={configured} context={context} userName={userName} seedRef={seedRef} />}
          {mode === "rfq" && <RfqParser />}
          {mode === "quote" && <QuoteDrafter />}
          {mode === "company" && <CompanyLookup />}
          {mode === "email" && <EmailWriter />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default AiStudioClient;

/* ============================ Mode tab =========================== */
function ModeTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "text-primary-foreground" : "border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="manz-mode-active"
          className="absolute inset-0 -z-0 rounded-xl btn-gradient"
          transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
        />
      )}
      <Icon className="relative z-10 h-4 w-4" />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

/* =============================== HUB ============================== */
function Hub({
  configured,
  context,
  userName,
  setMode,
  goChat,
}: {
  configured: boolean;
  context: string;
  userName: string | null;
  setMode: (m: Mode) => void;
  goChat: (seed?: string) => void;
}) {
  const reduce = useReducedMotion();
  const first = userName?.trim().split(/\s+/)[0] ?? null;
  const insights = React.useMemo(() => buildInsights(context), [context]);

  // SSR-safe clock: only read after mount (no Date during render).
  const [updated, setUpdated] = React.useState<string | null>(null);
  React.useEffect(() => {
    setUpdated(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const placeholders = [
    "summarize my open pipeline and biggest risks",
    "which deals should I prioritize this month?",
    "draft a follow-up for a stalled staffing deal",
    "who haven't I followed up with yet?",
  ];
  const chips = [
    "Summarize my open pipeline and biggest risks.",
    "What should I prioritize to hit target this month?",
    "Who haven't I followed up with recently?",
    "Forecast vs target this quarter.",
  ];

  const [draft, setDraft] = React.useState("");

  return (
    <div className="relative space-y-12">
      {/* particles + glow behind the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[300px] max-w-[560px]">
        <div
          className="absolute left-1/2 top-[-40px] h-[300px] w-[480px] -translate-x-1/2"
          style={{ background: "radial-gradient(circle at 50% 40%, hsl(var(--primary)/.16), transparent 68%)", filter: "blur(24px)" }}
        />
        {!reduce &&
          [
            { l: "16%", s: 4, d: "3.6s", delay: "0s", c: "var(--chart-1)" },
            { l: "36%", s: 5, d: "4.2s", delay: ".8s", c: "var(--primary)" },
            { l: "58%", s: 3, d: "3.2s", delay: "1.4s", c: "var(--chart-2)" },
            { l: "78%", s: 4, d: "4s", delay: ".4s", c: "var(--chart-5)" },
          ].map((p, i) => (
            <span
              key={i}
              className="manz-particle absolute bottom-10 rounded-full"
              style={{
                left: p.l,
                width: p.s,
                height: p.s,
                background: "hsl(var(" + p.c + "))",
                animation: "manz-particleRise " + p.d + " ease-out " + p.delay + " infinite",
              }}
            />
          ))}
      </div>

      {/* HERO */}
      <div className="flex flex-col items-center text-center">
        <div
          className={cn("relative mb-5", !reduce && "manz-float")}
          style={!reduce ? { animation: "manz-floatY 6.5s ease-in-out infinite" } : undefined}
        >
          <div
            aria-hidden
            className="absolute -inset-3 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)/.22), transparent 70%)", filter: "blur(14px)" }}
          />
          <Orb size={76} className="relative" />
        </div>
        <div className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Manzil One · AI Workspace
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
          {first ? "Good to see you, " + first + "." : "Good to see you."}
        </h1>
        <p className="mt-2.5 max-w-md text-base leading-relaxed text-muted-foreground">
          Manz AI has been watching your pipeline. Ask anything, or pick up a thread below.
        </p>
      </div>

      {/* COMPOSER */}
      <div className="mx-auto w-full max-w-2xl">
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const q = draft.trim();
            goChat(q || undefined);
          }}
          className="manz-halo relative rounded-[18px] bg-card p-1.5"
          style={{
            boxShadow:
              "0 32px 70px -30px hsl(var(--primary)/.34), 0 14px 30px -16px hsl(var(--primary)/.18)",
          }}
        >
          <div className="relative flex items-center gap-3 rounded-[14px] px-4 py-2.5">
            <Orb size={30} />
            <div className="relative min-w-0 flex-1">
              <Input
                value={draft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
                placeholder=""
                aria-label="Ask Manz AI"
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
              {draft.length === 0 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-[15px]"
                >
                  <span className="text-foreground/80">Ask Manz AI,&nbsp;</span>
                  <span className="text-muted-foreground">e.g.&nbsp;</span>
                  {reduce ? (
                    <span className="text-muted-foreground">{placeholders[0]}</span>
                  ) : (
                    <span className="relative inline-block h-[22px] overflow-hidden align-bottom">
                      <span className="manz-ph block" style={{ animation: "manz-phRotate 16s cubic-bezier(.6,0,.2,1) infinite" }}>
                        {[...placeholders, placeholders[0]].map((p, i) => (
                          <span key={i} className="block h-[26px] whitespace-nowrap leading-[26px] text-muted-foreground">
                            {p}
                          </span>
                        ))}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border bg-background/60 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Attach"
              tabIndex={-1}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <Button type="submit" variant="gradient" size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label="Send to Manz AI">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="mt-3.5 flex flex-wrap justify-center gap-2">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => goChat(c)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[12.5px] text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              {c}
            </button>
          ))}
        </div>

        {!configured ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Manz AI isn&apos;t configured yet — add a Gemini API key to enable live answers.
          </p>
        ) : null}
      </div>

      {/* CAPABILITY CARDS */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {TOOLS.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => (t.id === "chat" ? goChat() : setMode(t.id))}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-[18px] text-left shadow-sm transition-all hover:-translate-y-[3px] hover:shadow-md hover:border-border/80",
                !reduce && "manz-rise"
              )}
              style={!reduce ? { animationDelay: 0.05 + i * 0.06 + "s" } : undefined}
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
                  style={{ background: "hsl(" + t.tint + "/.14)", color: "hsl(" + t.tint + ")" }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold tracking-tight">{t.label}</div>
                  <div className="mt-0.5 font-mono text-[11px] tracking-[0.04em] text-muted-foreground">{t.kicker}</div>
                </div>
                <ArrowRight className="h-[18px] w-[18px] -translate-x-1.5 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{t.blurb}</p>
            </button>
          );
        })}
      </div>

      {/* INSIGHTS FEED */}
      <div>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="manz-dot h-2 w-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
          <h2 className="text-[15px] font-semibold tracking-tight">What Manz AI noticed</h2>
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
            {updated ? "UPDATED " + updated : "LIVE"}
          </span>
        </div>

        {context ? (
          <div className="flex flex-col gap-3">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} index={i} reduce={!!reduce} onAct={() => goChat(ins.title)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Connect your pipeline data and Manz AI will surface risks, momentum and forecast highlights here.
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight, index, reduce, onAct }: { insight: Insight; index: number; reduce: boolean; onAct: () => void }) {
  const Icon = insight.icon;
  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        !reduce && "manz-rise"
      )}
      style={!reduce ? { animationDelay: 0.06 + index * 0.08 + "s" } : undefined}
    >
      <div className="min-w-0 flex-1">
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] tracking-[0.1em]"
          style={{ color: "hsl(" + insight.tint + ")", background: "hsl(" + insight.tint + "/.13)" }}
        >
          <Icon className="h-3 w-3" />
          {insight.badge}
        </span>
        <div className="mt-2.5 text-[15.5px] font-semibold leading-snug tracking-tight">{insight.title}</div>
        <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{insight.detail}</div>
        <button
          type="button"
          onClick={onAct}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-all hover:gap-2.5"
        >
          Ask Manz AI <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <InsightViz insight={insight} reduce={reduce} />
    </div>
  );
}

function InsightViz({ insight, reduce }: { insight: Insight; reduce: boolean }) {
  if (insight.viz === "ring") {
    const pct = insight.value ?? 80;
    const r = 23;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    return (
      <div className="flex shrink-0 flex-col items-center justify-center gap-1">
        <div className="relative h-[54px] w-[54px]">
          <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="27" cy="27" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="27"
              cy="27"
              r={r}
              fill="none"
              stroke={"hsl(" + insight.tint + ")"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={reduce ? offset : circ}
              style={
                reduce
                  ? undefined
                  : { transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.9,.25,1.05) .2s", strokeDashoffset: offset }
              }
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">{pct}</div>
        </div>
        <span className="font-mono text-[9px] tracking-[0.08em] text-muted-foreground">SCORE</span>
      </div>
    );
  }

  const bars = insight.viz === "bars2" ? [38, 50, 46, 68, 84, 100] : [56, 78, 94];
  return (
    <div className="flex h-16 shrink-0 items-end gap-1.5 pb-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn("w-2.5 rounded", !reduce && "manz-bar")}
          style={{
            height: h + "%",
            background:
              i === bars.length - 1
                ? "linear-gradient(180deg,hsl(var(--chart-1)),hsl(var(--primary)))"
                : "hsl(" + insight.tint + ")",
            animationDelay: 0.15 + i * 0.08 + "s",
          }}
        />
      ))}
    </div>
  );
}

/* =============================== CHAT ============================= */
type Msg = { role: "user" | "assistant"; text: string; thought?: number };

function Typewriter({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(reduce ? text.length : 0);
  React.useEffect(() => {
    if (reduce) {
      setN(text.length);
      return;
    }
    setN(0);
    const step = Math.max(1, Math.round(text.length / 90));
    const id = window.setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          window.clearInterval(id);
          return v;
        }
        return Math.min(text.length, v + step);
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [text, reduce]);
  return (
    <span className="whitespace-pre-wrap">
      {text.slice(0, n)}
      {n < text.length ? <span className="manz-caret manz-aurora">▍</span> : null}
    </span>
  );
}

function Chat({
  configured,
  context,
  userName,
  seedRef,
}: {
  configured: boolean;
  context: string;
  userName: string | null;
  seedRef: React.MutableRefObject<string | null>;
}) {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const first = userName?.trim().split(/\s+/)[0] ?? null;

  const send = React.useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || loading) return;
      setErr(null);
      const next: Msg[] = [...messages, { role: "user", text: q }];
      setMessages(next);
      setInput("");
      setLoading(true);
      const started = typeof performance !== "undefined" ? performance.now() : 0;
      try {
        const { text: reply } = await callAI<{ text: string }>({
          tool: "chat",
          messages: next.map((m) => ({ role: m.role, text: m.text })),
          context,
        });
        const secs =
          typeof performance !== "undefined"
            ? Math.max(1, Math.round((performance.now() - started) / 1000))
            : 2;
        setMessages((m) => [...m, { role: "assistant", text: reply, thought: secs }]);
      } catch (e) {
        setErr(e as AiError);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, context]
  );

  // Seed from a hub prompt exactly once.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const seed = seedRef.current;
    seedRef.current = null;
    if (seed) void send(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const empty = messages.length === 0 && !loading;
  const suggestions = [
    "Summarize my open pipeline and biggest risks.",
    "Draft a follow-up email for a stalled staffing deal.",
    "What should I prioritize to hit target this month?",
  ];
  const followUps = [
    "Draft re-engagement emails for these.",
    "Which of these is most winnable?",
    "What changed in the last 7 days?",
  ];

  return (
    <div className="luxury-card flex h-[clamp(460px,64vh,720px)] flex-col overflow-hidden">
      {/* thread header */}
      <div className="flex items-center gap-3 border-b bg-background/40 px-5 py-3.5">
        <Orb size={30} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight">{messages[0]?.text ?? "Ask Manz AI"}</div>
          <div className="text-[11.5px] text-muted-foreground">Manz AI · reasons over your live workspace</div>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setErr(null);
            }}
            className="rounded-lg border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            New chat
          </button>
        ) : null}
      </div>

      {/* thread scroll */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-5 py-7">
          {empty ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Orb size={56} />
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                {first ? first + ", ask " : "Ask "}Manz AI about your pipeline, draft outreach, or get pricing guidance.
              </p>
              <div className="mt-4 flex flex-col items-stretch gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border bg-background/50 px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) => {
            const last = i === messages.length - 1;
            if (m.role === "user") {
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                  <div
                    className="max-w-[80%] rounded-[16px_16px_4px_16px] border px-3.5 py-2.5 text-[14.5px] leading-relaxed"
                    style={{ background: "hsl(var(--primary)/.10)", borderColor: "hsl(var(--primary)/.22)" }}
                  >
                    {m.text}
                  </div>
                </motion.div>
              );
            }
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Orb size={32} className="mt-0.5" />
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold">Manz AI</span>
                    {last ? <span className="text-[11px] text-muted-foreground">just now</span> : null}
                  </div>
                  {m.thought ? (
                    <div className="rounded-xl border bg-background/50 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CircleCheck className="h-3.5 w-3.5 text-success" />
                        <span className="font-semibold text-foreground/80">Thought for {m.thought}s</span>
                        <span className="text-muted-foreground/70">·</span>
                        <span>parsed intent → queried workspace → reasoned → drafted</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="text-[14.5px] leading-[1.62] text-foreground/90">
                    {last ? <Typewriter text={m.text} /> : <span className="whitespace-pre-wrap">{m.text}</span>}
                  </div>
                  {last && !loading ? (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {followUps.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => send(f)}
                          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[12.5px] text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                        >
                          <Sparkles className="h-3 w-3 text-primary" />
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}

          {loading ? (
            <div className="flex gap-3">
              <Orb size={32} className="mt-0.5" />
              <div className="flex items-center pt-1.5">
                <Thinking />
              </div>
            </div>
          ) : null}

          {err ? <ErrorNote err={err} /> : null}
        </div>
      </div>

      {/* composer */}
      <div className="border-t bg-background/40 p-3">
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-[760px] items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={configured ? "Reply to Manz AI…  (Enter to send, Shift+Enter for newline)" : "Reply to Manz AI…"}
            rows={1}
            className="max-h-32 min-h-[44px] resize-none"
          />
          <Button type="submit" variant="gradient" size="icon" className="h-11 w-11 shrink-0" disabled={loading || !input.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="mt-2 text-center text-[11px] text-muted-foreground">
          Manz AI can make mistakes — verify important numbers against the record.
        </div>
      </div>
    </div>
  );
}

/* ====================== Generic tool scaffold ===================== */
function ToolHeader({ tool }: { tool: Mode }) {
  const t = TOOLS.find((x) => x.id === tool);
  if (!t) return null;
  const Icon = t.icon;
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ background: "hsl(" + t.tint + "/.14)", color: "hsl(" + t.tint + ")" }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-[15px] font-semibold tracking-tight">{t.label}</div>
        <div className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">{t.kicker}</div>
      </div>
    </div>
  );
}

function ToolShell({
  children,
  onRun,
  runLabel = "Generate",
  loading,
  err,
  canRun,
}: {
  children: React.ReactNode;
  onRun: () => void;
  runLabel?: string;
  loading: boolean;
  err: AiError | null;
  canRun: boolean;
}) {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">{children}</div>
      <div className="flex items-center gap-3">
        <Button onClick={onRun} variant="gradient" disabled={loading || !canRun}>
          {loading ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" /> Generating…
            </>
          ) : (
            <>
              <WandSparkles className="h-4 w-4" /> {runLabel}
            </>
          )}
        </Button>
        {loading ? <Thinking label="Working" /> : null}
      </div>
      {err ? <ErrorNote err={err} /> : null}
    </div>
  );
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...reveal} className="manz-halo relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      {children}
    </motion.div>
  );
}

function LoadingResult() {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="shimmer h-4 w-1/3 rounded" />
      <div className="shimmer h-3 w-full rounded" />
      <div className="shimmer h-3 w-5/6 rounded" />
      <div className="shimmer h-3 w-2/3 rounded" />
    </div>
  );
}

/* ========================== RFQ Parser =========================== */
type RfqItem = {
  category: string;
  role: string;
  description: string;
  quantity: number;
  durationMonths: number | null;
  location: string | null;
  skills: string[];
};
type RfqResult = { title: string; customer: string | null; summary: string; currency: string; items: RfqItem[] };

function RfqParser() {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<RfqResult | null>(null);

  async function run() {
    setErr(null);
    setRes(null);
    setLoading(true);
    try {
      const { result } = await callAI<{ result: RfqResult }>({ tool: "parse-rfq", text });
      setRes(result);
    } catch (e) {
      setErr(e as AiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <ToolHeader tool="rfq" />
      <ToolShell onRun={run} runLabel="Parse RFQ" loading={loading} err={err} canRun={text.trim().length > 5}>
        <label className="text-sm font-medium">Paste the RFQ email or document text</label>
        <Textarea
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          rows={7}
          placeholder="e.g. We need 3 senior SAP FICO consultants in Dubai for 6 months, plus 1 project manager…"
          className="mt-2 resize-y"
        />
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold">{res.title || "Parsed RFQ"}</div>
              <div className="text-sm text-muted-foreground">
                {res.customer ? res.customer + " · " : ""}
                {res.summary}
              </div>
            </div>
            <CopyBtn text={JSON.stringify(res, null, 2)} />
          </div>
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Duration</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2">Skills</th>
                </tr>
              </thead>
              <tbody>
                {res.items?.map((it, i) => (
                  <tr key={i} className="border-b align-top last:border-0">
                    <td className="py-2 pr-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{it.category}</span>
                    </td>
                    <td className="py-2 pr-3 font-medium">
                      {it.role}
                      <div className="text-xs font-normal text-muted-foreground">{it.description}</div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{it.quantity}</td>
                    <td className="py-2 pr-3 tabular-nums">{it.durationMonths ? it.durationMonths + " mo" : "—"}</td>
                    <td className="py-2 pr-3">{it.location ?? "—"}</td>
                    <td className="py-2 text-xs text-muted-foreground">{(it.skills ?? []).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="relative mt-3 text-xs text-muted-foreground">Review and use these to create an RFQ.</p>
        </ResultCard>
      ) : null}
    </div>
  );
}

/* ========================= Quote Drafter ========================= */
type QuoteResult = {
  scope: string;
  assumptions: string[];
  suggestedLineItems: { item: string; basis: string; estimate: string }[];
  pricingNote: string;
  nextSteps: string[];
};

function QuoteDrafter() {
  const [brief, setBrief] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<QuoteResult | null>(null);

  async function run() {
    setErr(null);
    setRes(null);
    setLoading(true);
    try {
      const { result } = await callAI<{ result: QuoteResult }>({ tool: "draft-quote", brief });
      setRes(result);
    } catch (e) {
      setErr(e as AiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <ToolHeader tool="quote" />
      <ToolShell onRun={run} runLabel="Draft quote" loading={loading} err={err} canRun={brief.trim().length > 5}>
        <label className="text-sm font-medium">Describe the deal / requirement</label>
        <Textarea
          value={brief}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBrief(e.target.value)}
          rows={6}
          placeholder="e.g. 6-month SAP S/4HANA rollout for a Dubai real-estate group; 1 PM, 2 functional, 1 basis; T&M…"
          className="mt-2 resize-y"
        />
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="relative flex items-start justify-between gap-3">
            <div className="text-base font-semibold">Quotation draft</div>
            <CopyBtn
              text={
                "Scope:\n" +
                res.scope +
                "\n\nAssumptions:\n" +
                (res.assumptions || []).map((a) => "- " + a).join("\n") +
                "\n\nLine items:\n" +
                (res.suggestedLineItems || []).map((l) => "- " + l.item + " (" + l.basis + "): " + l.estimate).join("\n") +
                "\n\nPricing note: " +
                res.pricingNote +
                "\n\nNext steps:\n" +
                (res.nextSteps || []).map((s) => "- " + s).join("\n")
              }
            />
          </div>
          <p className="relative mt-2 text-sm text-foreground/90">{res.scope}</p>
          {res.suggestedLineItems?.length ? (
            <div className="relative mt-4">
              <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Suggested line items</div>
              <div className="mt-2 grid gap-2">
                {res.suggestedLineItems.map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border bg-background/50 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{l.item}</span> <span className="text-muted-foreground">· {l.basis}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">{l.estimate}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
            {res.assumptions?.length ? (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Assumptions</div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {res.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {res.nextSteps?.length ? (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Next steps</div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                  {res.nextSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          {res.pricingNote ? <p className="relative mt-4 rounded-xl bg-primary/5 p-3 text-sm text-foreground/80">{res.pricingNote}</p> : null}
        </ResultCard>
      ) : null}
    </div>
  );
}

/* ========================= Company Lookup ======================== */
type CompanyResult = {
  overview: string;
  industry: string;
  whatTheyDo: string;
  sizeSignal: string;
  talkingPoints: string[];
  fitForUs: string;
  confidence: "high" | "medium" | "low";
};

function CompanyLookup() {
  const [company, setCompany] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<CompanyResult | null>(null);

  async function run() {
    setErr(null);
    setRes(null);
    setLoading(true);
    try {
      const { result } = await callAI<{ result: CompanyResult }>({ tool: "company-overview", company, website: website || undefined });
      setRes(result);
    } catch (e) {
      setErr(e as AiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <ToolHeader tool="company" />
      <ToolShell onRun={run} runLabel="Get overview" loading={loading} err={err} canRun={company.trim().length > 0}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Company name</label>
            <Input
              value={company}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)}
              placeholder="e.g. Al Hamra Real Estate"
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Website / LinkedIn URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={website}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
              placeholder="https://…"
              className="mt-2"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Uses AI knowledge — verify specifics before quoting. (LinkedIn data isn&apos;t pulled directly; paste a URL for reference.)
        </p>
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold">
                {company}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    res.confidence === "high"
                      ? "bg-success/15 text-success"
                      : res.confidence === "medium"
                        ? "bg-warning/15 text-warning"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {res.confidence} confidence
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {res.industry} · {res.sizeSignal}
              </div>
            </div>
            <CopyBtn
              text={
                company +
                "\n" +
                res.overview +
                "\n\nWhat they do: " +
                res.whatTheyDo +
                "\n\nTalking points:\n" +
                (res.talkingPoints || []).map((t) => "- " + t).join("\n") +
                "\n\nFit: " +
                res.fitForUs
              }
            />
          </div>
          <p className="relative mt-3 text-sm text-foreground/90">{res.overview}</p>
          <p className="relative mt-2 text-sm text-muted-foreground">{res.whatTheyDo}</p>
          {res.talkingPoints?.length ? (
            <div className="relative mt-4">
              <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Talking points</div>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">
                {res.talkingPoints.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {res.fitForUs ? (
            <p className="relative mt-4 rounded-xl bg-primary/5 p-3 text-sm text-foreground/80">
              <span className="font-medium">Why we fit: </span>
              {res.fitForUs}
            </p>
          ) : null}
        </ResultCard>
      ) : null}
    </div>
  );
}

/* ========================== Email Writer ========================= */
const TONES = ["Professional", "Friendly", "Concise", "Persuasive"] as const;
type EmailResult = { subject: string; body: string };

function EmailWriter() {
  const [emailContext, setEmailContext] = React.useState("");
  const [tone, setTone] = React.useState<(typeof TONES)[number]>("Professional");
  const [purpose, setPurpose] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<EmailResult | null>(null);

  async function run() {
    setErr(null);
    setRes(null);
    setLoading(true);
    try {
      const { result } = await callAI<{ result: EmailResult }>({
        tool: "draft-email",
        context: emailContext,
        tone,
        purpose: purpose || undefined,
      });
      setRes(result);
    } catch (e) {
      setErr(e as AiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <ToolHeader tool="email" />
      <ToolShell onRun={run} runLabel="Write email" loading={loading} err={err} canRun={emailContext.trim().length > 3}>
        <label className="text-sm font-medium">Context (deal, contact, what happened)</label>
        <Textarea
          value={emailContext}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailContext(e.target.value)}
          rows={4}
          placeholder="e.g. Sent a quotation to Priya at Crescent Capital 5 days ago, no reply. ₹1.25 Cr licensing retainer."
          className="mt-2 resize-y"
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">
              Purpose <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={purpose}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPurpose(e.target.value)}
              placeholder="e.g. polite follow-up + offer a call"
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    tone === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Subject</div>
              <div className="font-medium">{res.subject}</div>
            </div>
            <CopyBtn text={"Subject: " + res.subject + "\n\n" + res.body} />
          </div>
          <div className="relative mt-3 whitespace-pre-wrap rounded-xl border bg-background/50 p-3 text-sm text-foreground/90">{res.body}</div>
        </ResultCard>
      ) : null}
    </div>
  );
}