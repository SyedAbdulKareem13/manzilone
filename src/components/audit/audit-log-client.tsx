"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AuditTrail, type AuditEntry } from "@/components/audit/audit-trail";

const MODULES = [
  { value: "ALL", label: "All modules" },
  { value: "LEAD", label: "Leads" },
  { value: "OPPORTUNITY", label: "Opportunities" },
  { value: "QUOTATION", label: "Quotations" },
  { value: "RFQ", label: "RFQs" },
];

const ACTIONS = [
  { value: "ALL", label: "All actions" },
  { value: "CREATED", label: "Created" },
  { value: "UPDATED", label: "Updated" },
  { value: "STAGE_CHANGED", label: "Stage changed" },
  { value: "STATUS_CHANGED", label: "Status changed" },
  { value: "CONVERTED", label: "Converted" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DELETED", label: "Deleted" },
];

export function AuditLogClient({ entries }: { entries: AuditEntry[] }) {
  const [module, setModule] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (module !== "ALL" && e.entityType !== module) return false;
      if (action !== "ALL" && e.action !== action) return false;
      if (term) {
        const hay = `${e.entityLabel ?? ""} ${e.summary ?? ""} ${e.actorName ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [entries, module, action, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search record, change or person…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground sm:ml-auto">{filtered.length} event{filtered.length === 1 ? "" : "s"}</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState
              title="No matching activity"
              description="Try a different module, action or search term. New changes appear here automatically."
            />
          ) : (
            <AuditTrail entries={filtered} showEntity />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
