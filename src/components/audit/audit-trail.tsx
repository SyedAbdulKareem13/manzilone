import Link from "next/link";
import {
  Plus, Pencil, GitBranch, ArrowRightLeft, Send, Check, X, Trash2, Dot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime, initials, formatDate } from "@/lib/utils";

export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  action: string;
  summary: string | null;
  changes: { field: string; from: unknown; to: unknown }[] | null;
  actorName: string | null;
  createdAt: string;
};

const ACTION_META: Record<string, { icon: any; cls: string; label: string }> = {
  CREATED: { icon: Plus, cls: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400", label: "Created" },
  UPDATED: { icon: Pencil, cls: "bg-info/12 text-info", label: "Updated" },
  STAGE_CHANGED: { icon: GitBranch, cls: "bg-primary/12 text-primary", label: "Stage" },
  STATUS_CHANGED: { icon: GitBranch, cls: "bg-primary/12 text-primary", label: "Status" },
  CONVERTED: { icon: ArrowRightLeft, cls: "bg-primary/12 text-primary", label: "Converted" },
  SUBMITTED: { icon: Send, cls: "bg-info/12 text-info", label: "Submitted" },
  APPROVED: { icon: Check, cls: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400", label: "Approved" },
  REJECTED: { icon: X, cls: "bg-rose-500/12 text-rose-600 dark:text-rose-400", label: "Rejected" },
  DELETED: { icon: Trash2, cls: "bg-rose-500/12 text-rose-600 dark:text-rose-400", label: "Deleted" },
};

const ENTITY_ROUTE: Record<string, string> = {
  LEAD: "/app/leads",
  OPPORTUNITY: "/app/opportunities",
  QUOTATION: "/app/quotations",
  RFQ: "/app/rfqs",
};

function humanizeField(f: string) {
  return f
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bId\b/, "")
    .trim();
}

function fmtVal(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v);
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
}

export function AuditTrail({
  entries,
  showEntity = false,
  emptyHint = "No history yet. Changes will appear here as the record is edited.",
}: {
  entries: AuditEntry[];
  showEntity?: boolean;
  emptyHint?: string;
}) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">{emptyHint}</p>;
  }
  return (
    <ol className="relative space-y-4">
      <span className="absolute bottom-2 left-[15px] top-2 w-px bg-border" aria-hidden />
      {entries.map((e) => {
        const meta = ACTION_META[e.action] ?? { icon: Dot, cls: "bg-muted text-muted-foreground", label: e.action };
        const Icon = meta.icon;
        const href = ENTITY_ROUTE[e.entityType]
          ? `${ENTITY_ROUTE[e.entityType]}/${e.entityId}`
          : null;
        return (
          <li key={e.id} className="relative flex gap-3">
            <span className={cn("relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", meta.cls)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl border bg-card/60 px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                {showEntity && e.entityLabel ? (
                  href ? (
                    <Link href={href} className="text-xs font-semibold text-primary hover:underline">
                      {e.entityLabel}
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold">{e.entityLabel}</span>
                  )
                ) : null}
                <span className="text-sm text-foreground/85">{e.summary}</span>
                <span className="ml-auto whitespace-nowrap text-[11px] text-muted-foreground" title={formatDate(e.createdAt)}>
                  {formatRelativeTime(e.createdAt)}
                </span>
              </div>

              {e.changes && e.changes.length ? (
                <div className="mt-2 space-y-1 border-t pt-2">
                  {e.changes.map((c, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-medium text-muted-foreground">{humanizeField(c.field)}:</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground line-through decoration-muted-foreground/40">
                        {fmtVal(c.from)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">{fmtVal(c.to)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-muted text-[8px] font-semibold">
                  {initials(e.actorName)}
                </span>
                {e.actorName ?? "System"}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
