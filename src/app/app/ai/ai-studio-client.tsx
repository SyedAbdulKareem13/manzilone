"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  WandSparkles,
  Send,
  FileText,
  Building2,
  Mail,
  ReceiptText,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- *
 * Scoped AI animations (kept local to this surface).
 * ---------------------------------------------------------------- */
const AI_CSS = `
@keyframes ai-aurora { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
@keyframes ai-spin { to { transform: rotate(360deg) } }
@keyframes ai-pulse-dot { 0%,80%,100%{ transform:scale(.6); opacity:.4 } 40%{ transform:scale(1); opacity:1 } }
@keyframes ai-sheen { 0%{ transform:translateX(-130%) } 100%{ transform:translateX(230%) } }
@keyframes ai-float { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-5px) } }
.ai-aurora-text{ background:linear-gradient(100deg,hsl(var(--chart-1)),hsl(var(--chart-5)),hsl(var(--chart-2)),hsl(var(--chart-1))); background-size:300% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; animation:ai-aurora 6s ease infinite; }
.ai-ring{ position:relative; }
.ai-ring::before{ content:""; position:absolute; inset:-1px; border-radius:inherit; padding:1px; background:conic-gradient(from var(--a,0deg), hsl(var(--chart-1)/.0), hsl(var(--chart-1)/.7), hsl(var(--chart-5)/.7), hsl(var(--chart-1)/.0)); -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; animation:ai-spin 4s linear infinite; pointer-events:none; }
.ai-thinking-dot{ width:6px;height:6px;border-radius:50%;background:hsl(var(--primary)); display:inline-block; animation:ai-pulse-dot 1.2s infinite ease-in-out; }
.ai-shimmer{ position:relative; overflow:hidden; }
.ai-shimmer::after{ content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,hsl(var(--primary)/.18),transparent); transform:translateX(-130%); animation:ai-sheen 1.4s infinite; }
`;

type Tool = "assistant" | "rfq" | "company" | "email" | "quote";
const TOOLS: { id: Tool; label: string; icon: React.ComponentType<{ className?: string }>; sub: string }[] = [
  { id: "assistant", label: "Assistant", icon: WandSparkles, sub: "Ask anything about your workspace" },
  { id: "rfq", label: "RFQ Parser", icon: FileText, sub: "Paste an RFQ → structured line items" },
  { id: "quote", label: "Quote Drafter", icon: ReceiptText, sub: "Brief → scope, assumptions, pricing" },
  { id: "company", label: "Company Lookup", icon: Building2, sub: "AI overview + talking points" },
  { id: "email", label: "Email Writer", icon: Mail, sub: "Draft outreach in your tone" },
];

type AiError = { message: string; code?: string };

async function callAI<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: AiError = { message: data?.error ?? "AI request failed.", code: data?.code };
    throw err;
  }
  return data as T;
}

function Thinking({ label = "Thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="ai-thinking-dot" style={{ animationDelay: "0ms" }} />
      <span className="ai-thinking-dot" style={{ animationDelay: "160ms" }} />
      <span className="ai-thinking-dot" style={{ animationDelay: "320ms" }} />
      <span className="ml-1.5 ai-aurora-text font-medium">{label}…</span>
    </div>
  );
}

function ErrorNote({ err }: { err: AiError }) {
  const quota = err.code === "rate_limited";
  const cfg = err.code === "not_configured";
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <div className="font-medium">{err.message}</div>
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
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {done ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
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
  const [tool, setTool] = React.useState<Tool>("assistant");
  const active = TOOLS.find((t) => t.id === tool)!;

  return (
    <div className="space-y-5">
      <style>{AI_CSS}</style>

      {/* Animated hero banner */}
      <motion.div {...reveal} className="luxury-card relative overflow-hidden p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.13]"
          style={{
            background:
              "conic-gradient(from 120deg at 30% 30%, hsl(var(--chart-1)), hsl(var(--chart-5)), hsl(var(--chart-2)), hsl(var(--chart-1)))",
            backgroundSize: "200% 200%",
            animation: "ai-aurora 10s ease infinite",
          }}
        />
        <div className="flex items-center gap-4">
          <div className="ai-ring relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(var(--chart-1))/.25] to-[hsl(var(--chart-5))/.25] text-primary" style={{ animation: "ai-float 4s ease-in-out infinite" }}>
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {userName ? `Hi ${userName.split(" ")[0]}, ` : ""}
              <span className="ai-aurora-text">how can I help close deals today?</span>
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{active.sub}</p>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
            <span className="ai-thinking-dot" style={{ width: 6, height: 6, animationDuration: "2s" }} />
            Powered by Gemini
          </span>
        </div>
        {context ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {context.split(" · ").map((c) => (
              <span key={c} className="rounded-full border bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
        ) : null}
      </motion.div>

      {/* Tool switcher */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => {
          const on = t.id === tool;
          const Ic = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                on ? "text-primary-foreground" : "border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {on && (
                <motion.span
                  layoutId="ai-tool-active"
                  className="absolute inset-0 -z-0 rounded-xl btn-gradient"
                  transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
                />
              )}
              <Ic className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active tool */}
      <AnimatePresence mode="wait">
        <motion.div key={tool} {...reveal}>
          {tool === "assistant" && <Assistant configured={configured} context={context} />}
          {tool === "rfq" && <RfqParser />}
          {tool === "quote" && <QuoteDrafter />}
          {tool === "company" && <CompanyLookup />}
          {tool === "email" && <EmailWriter />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ============================ Assistant =========================== */
type Msg = { role: "user" | "assistant"; text: string };

function Typewriter({ text }: { text: string }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    setN(0);
    const step = Math.max(1, Math.round(text.length / 90));
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id);
          return v;
        }
        return Math.min(text.length, v + step);
      });
    }, 16);
    return () => clearInterval(id);
  }, [text]);
  return <span className="whitespace-pre-wrap">{text.slice(0, n)}{n < text.length ? <span className="ai-aurora-text">▍</span> : null}</span>;
}

function Assistant({ configured, context }: { configured: boolean; context: string }) {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const suggestions = [
    "Summarize my open pipeline and biggest risks.",
    "Draft a follow-up email for a stalled staffing deal.",
    "What should I prioritize to hit target this month?",
  ];

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setErr(null);
    const next: Msg[] = [...messages, { role: "user", text: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { text: reply } = await callAI<{ text: string }>({ tool: "chat", messages: next, context });
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setErr(e as AiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="luxury-card flex h-[clamp(420px,60vh,640px)] flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
        {messages.length === 0 && !loading ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="ai-ring grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(var(--chart-1))/.25] to-[hsl(var(--chart-5))/.25] text-primary" style={{ animation: "ai-float 4s ease-in-out infinite" }}>
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Ask Manzil AI about your pipeline, draft outreach, or get pricing guidance.
            </p>
            <div className="mt-4 flex flex-col items-stretch gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border bg-background/50 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && (
              <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[hsl(var(--chart-1))/.3] to-[hsl(var(--chart-5))/.3] text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.role === "user" ? "btn-gradient text-white" : "border bg-background/60"
              )}
            >
              {m.role === "assistant" && i === messages.length - 1 ? <Typewriter text={m.text} /> : <span className="whitespace-pre-wrap">{m.text}</span>}
            </div>
          </motion.div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[hsl(var(--chart-1))/.3] to-[hsl(var(--chart-5))/.3] text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <Thinking />
          </div>
        ) : null}

        {err ? <ErrorNote err={err} /> : null}
      </div>

      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={configured ? "Ask Manzil AI…  (Enter to send, Shift+Enter for newline)" : "Ask Manzil AI…"}
            rows={1}
            className="max-h-32 min-h-[44px] resize-none"
          />
          <Button type="submit" variant="gradient" size="icon" className="h-11 w-11 shrink-0" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ====================== Generic tool scaffold ===================== */
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
      <div className="luxury-card p-4 sm:p-5">{children}</div>
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
    <motion.div {...reveal} className="luxury-card ai-ring relative overflow-hidden p-4 sm:p-5">
      {children}
    </motion.div>
  );
}

function LoadingResult() {
  return (
    <div className="luxury-card ai-shimmer space-y-3 p-5">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-5/6 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

/* ========================== RFQ Parser =========================== */
type RfqItem = {
  category: string; role: string; description: string; quantity: number;
  durationMonths: number | null; location: string | null; skills: string[];
};
type RfqResult = { title: string; customer: string | null; summary: string; currency: string; items: RfqItem[] };

function RfqParser() {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<RfqResult | null>(null);

  async function run() {
    setErr(null); setRes(null); setLoading(true);
    try {
      const { result } = await callAI<{ result: RfqResult }>({ tool: "parse-rfq", text });
      setRes(result);
    } catch (e) { setErr(e as AiError); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <ToolShell onRun={run} runLabel="Parse RFQ" loading={loading} err={err} canRun={text.trim().length > 5}>
        <label className="text-sm font-medium">Paste the RFQ email or document text</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder="e.g. We need 3 senior SAP FICO consultants in Dubai for 6 months, plus 1 project manager…"
          className="mt-2 resize-y"
        />
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold">{res.title || "Parsed RFQ"}</div>
              <div className="text-sm text-muted-foreground">{res.customer ? `${res.customer} · ` : ""}{res.summary}</div>
            </div>
            <CopyBtn text={JSON.stringify(res, null, 2)} />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
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
                  <tr key={i} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{it.category}</span></td>
                    <td className="py-2 pr-3 font-medium">{it.role}<div className="text-xs font-normal text-muted-foreground">{it.description}</div></td>
                    <td className="py-2 pr-3 tabular-nums">{it.quantity}</td>
                    <td className="py-2 pr-3 tabular-nums">{it.durationMonths ? `${it.durationMonths} mo` : "—"}</td>
                    <td className="py-2 pr-3">{it.location ?? "—"}</td>
                    <td className="py-2 text-xs text-muted-foreground">{(it.skills ?? []).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Review and use these to create an RFQ. Auto-create wiring lands when AI merges to main.</p>
        </ResultCard>
      ) : null}
    </div>
  );
}

/* ========================= Quote Drafter ========================= */
type QuoteResult = {
  scope: string; assumptions: string[];
  suggestedLineItems: { item: string; basis: string; estimate: string }[];
  pricingNote: string; nextSteps: string[];
};

function QuoteDrafter() {
  const [brief, setBrief] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<QuoteResult | null>(null);

  async function run() {
    setErr(null); setRes(null); setLoading(true);
    try {
      const { result } = await callAI<{ result: QuoteResult }>({ tool: "draft-quote", brief });
      setRes(result);
    } catch (e) { setErr(e as AiError); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <ToolShell onRun={run} runLabel="Draft quote" loading={loading} err={err} canRun={brief.trim().length > 5}>
        <label className="text-sm font-medium">Describe the deal / requirement</label>
        <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={6} placeholder="e.g. 6-month SAP S/4HANA rollout for a Dubai real-estate group; 1 PM, 2 functional, 1 basis; T&M…" className="mt-2 resize-y" />
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="flex items-start justify-between gap-3">
            <div className="text-base font-semibold">Quotation draft</div>
            <CopyBtn text={`Scope:\n${res.scope}\n\nAssumptions:\n${(res.assumptions||[]).map(a=>`- ${a}`).join("\n")}\n\nLine items:\n${(res.suggestedLineItems||[]).map(l=>`- ${l.item} (${l.basis}): ${l.estimate}`).join("\n")}\n\nPricing note: ${res.pricingNote}\n\nNext steps:\n${(res.nextSteps||[]).map(s=>`- ${s}`).join("\n")}`} />
          </div>
          <p className="mt-2 text-sm text-foreground/90">{res.scope}</p>
          {res.suggestedLineItems?.length ? (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested line items</div>
              <div className="mt-2 grid gap-2">
                {res.suggestedLineItems.map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border bg-background/50 px-3 py-2 text-sm">
                    <div><span className="font-medium">{l.item}</span> <span className="text-muted-foreground">· {l.basis}</span></div>
                    <span className="tabular-nums text-muted-foreground">{l.estimate}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {res.assumptions?.length ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assumptions</div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">{res.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            ) : null}
            {res.nextSteps?.length ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next steps</div>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">{res.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            ) : null}
          </div>
          {res.pricingNote ? <p className="mt-4 rounded-xl bg-primary/5 p-3 text-sm text-foreground/80">{res.pricingNote}</p> : null}
        </ResultCard>
      ) : null}
    </div>
  );
}

/* ========================= Company Lookup ======================== */
type CompanyResult = {
  overview: string; industry: string; whatTheyDo: string; sizeSignal: string;
  talkingPoints: string[]; fitForUs: string; confidence: "high" | "medium" | "low";
};

function CompanyLookup() {
  const [company, setCompany] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<CompanyResult | null>(null);

  async function run() {
    setErr(null); setRes(null); setLoading(true);
    try {
      const { result } = await callAI<{ result: CompanyResult }>({ tool: "company-overview", company, website: website || undefined });
      setRes(result);
    } catch (e) { setErr(e as AiError); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <ToolShell onRun={run} runLabel="Get overview" loading={loading} err={err} canRun={company.trim().length > 0}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Company name</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Al Hamra Real Estate" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Website / LinkedIn URL <span className="text-muted-foreground">(optional)</span></label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="mt-2" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Uses AI knowledge — verify specifics before quoting. (LinkedIn data isn't pulled directly; paste a URL for reference.)</p>
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold">{company}
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                  res.confidence === "high" ? "bg-success/15 text-success" : res.confidence === "medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>
                  {res.confidence} confidence
                </span>
              </div>
              <div className="text-sm text-muted-foreground">{res.industry} · {res.sizeSignal}</div>
            </div>
            <CopyBtn text={`${company}\n${res.overview}\n\nWhat they do: ${res.whatTheyDo}\n\nTalking points:\n${(res.talkingPoints||[]).map(t=>`- ${t}`).join("\n")}\n\nFit: ${res.fitForUs}`} />
          </div>
          <p className="mt-3 text-sm text-foreground/90">{res.overview}</p>
          <p className="mt-2 text-sm text-muted-foreground">{res.whatTheyDo}</p>
          {res.talkingPoints?.length ? (
            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Talking points</div>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">{res.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          ) : null}
          {res.fitForUs ? <p className="mt-4 rounded-xl bg-primary/5 p-3 text-sm text-foreground/80"><span className="font-medium">Why we fit: </span>{res.fitForUs}</p> : null}
        </ResultCard>
      ) : null}
    </div>
  );
}

/* ========================== Email Writer ========================= */
const TONES = ["Professional", "Friendly", "Concise", "Persuasive"] as const;
type EmailResult = { subject: string; body: string };

function EmailWriter() {
  const [context, setContext] = React.useState("");
  const [tone, setTone] = React.useState<(typeof TONES)[number]>("Professional");
  const [purpose, setPurpose] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<AiError | null>(null);
  const [res, setRes] = React.useState<EmailResult | null>(null);

  async function run() {
    setErr(null); setRes(null); setLoading(true);
    try {
      const { result } = await callAI<{ result: EmailResult }>({ tool: "draft-email", context, tone, purpose: purpose || undefined });
      setRes(result);
    } catch (e) { setErr(e as AiError); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <ToolShell onRun={run} runLabel="Write email" loading={loading} err={err} canRun={context.trim().length > 3}>
        <label className="text-sm font-medium">Context (deal, contact, what happened)</label>
        <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} placeholder="e.g. Sent a quotation to Priya at Crescent Capital 5 days ago, no reply. ₹1.25 Cr licensing retainer." className="mt-2 resize-y" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Purpose <span className="text-muted-foreground">(optional)</span></label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. polite follow-up + offer a call" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Tone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => setTone(t)} className={cn("rounded-lg border px-2.5 py-1 text-xs transition-colors", tone === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent")}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </ToolShell>
      {loading ? <LoadingResult /> : null}
      {res ? (
        <ResultCard>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Subject</div>
              <div className="font-medium">{res.subject}</div>
            </div>
            <CopyBtn text={`Subject: ${res.subject}\n\n${res.body}`} />
          </div>
          <div className="mt-3 whitespace-pre-wrap rounded-xl border bg-background/50 p-3 text-sm text-foreground/90">{res.body}</div>
        </ResultCard>
      ) : null}
    </div>
  );
}
