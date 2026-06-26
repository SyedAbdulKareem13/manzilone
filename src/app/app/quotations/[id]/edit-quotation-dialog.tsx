"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users, KeyRound, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { computeQuotation } from "@/lib/quotation-engine";
import { formatCurrency } from "@/lib/utils";

type ItemType = "MANPOWER" | "NON_MANPOWER" | "LICENSE";
export type EditableItem = {
  itemType: ItemType;
  description: string;
  quantity: number;
  uom?: string | null;
  unitCost: number;
  markupPct: number;
  discountPct: number;
  taxPct: number;
  manpowerGrade?: string | null;
  manpowerExperience?: string | null;
  licenseProduct?: string | null;
  licenseDuration?: string | null;
};

type Props = {
  quotation: {
    id: string;
    quotationNumber: string;
    notes: string | null;
    termsAndConditions: string | null;
    validUntil: string | null; // ISO
    items: EditableItem[];
  };
  editable: boolean;
};

function lineTotal(i: EditableItem) {
  const base = i.unitCost * i.quantity;
  const afterMarkup = base * (1 + i.markupPct / 100);
  const afterDiscount = afterMarkup * (1 - i.discountPct / 100);
  return afterDiscount * (1 + i.taxPct / 100);
}

export function EditQuotationDialog({ quotation, editable }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [notes, setNotes] = React.useState(quotation.notes ?? "");
  const [terms, setTerms] = React.useState(quotation.termsAndConditions ?? "");
  const [validUntil, setValidUntil] = React.useState(quotation.validUntil ? quotation.validUntil.slice(0, 10) : "");
  const [items, setItems] = React.useState<EditableItem[]>(quotation.items);

  // Reset local state whenever the dialog re-opens (in case of a prior refresh).
  React.useEffect(() => {
    if (open) {
      setNotes(quotation.notes ?? "");
      setTerms(quotation.termsAndConditions ?? "");
      setValidUntil(quotation.validUntil ? quotation.validUntil.slice(0, 10) : "");
      setItems(quotation.items);
    }
  }, [open, quotation]);

  const totals = computeQuotation(
    items.map((i) => ({ unitCost: i.unitCost, quantity: i.quantity, markupPct: i.markupPct, discountPct: i.discountPct, taxPct: i.taxPct }))
  );

  function update(i: number, patch: Partial<EditableItem>) {
    setItems((p) => p.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i));
  }
  function add(type: ItemType) {
    setItems((p) => [
      ...p,
      { itemType: type, description: "", quantity: 1, unitCost: 0, markupPct: type === "MANPOWER" ? 35 : type === "LICENSE" ? 15 : 20, discountPct: 0, taxPct: 18 },
    ]);
  }

  async function save() {
    if (items.length === 0) return toast.error("Add at least one line item");
    if (items.some((i) => !i.description.trim())) return toast.error("Every line needs a description");
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, termsAndConditions: terms, validUntil: validUntil || null, items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the quotation");
        return;
      }
      toast.success("Quotation updated");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!editable) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit {quotation.quotationNumber}</DialogTitle>
          <DialogDescription>Change line items, pricing and terms. Totals and margin recompute live; every change is logged in the audit trail.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Valid until</Label>
            <Input type="date" className="mt-1.5" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <Label className="text-sm font-medium">Line items</Label>
          <div className="flex gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => add("MANPOWER")}><Users className="h-3.5 w-3.5" /> Manpower</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => add("LICENSE")}><KeyRound className="h-3.5 w-3.5" /> License</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => add("NON_MANPOWER")}><BriefcaseBusiness className="h-3.5 w-3.5" /> Non-MP</Button>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border bg-card/60 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="soft" className="capitalize">{item.itemType.toLowerCase().replace("_", " ")}</Badge>
                <Input className="h-8 flex-1" placeholder="Description" value={item.description} onChange={(e) => update(i, { description: e.target.value })} />
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-6">
                <Num label="Qty" value={item.quantity} onChange={(v) => update(i, { quantity: v })} />
                <Num label="Unit cost" value={item.unitCost} onChange={(v) => update(i, { unitCost: v })} />
                <Num label="Markup %" value={item.markupPct} onChange={(v) => update(i, { markupPct: v })} />
                <Num label="Disc %" value={item.discountPct} onChange={(v) => update(i, { discountPct: v })} />
                <Num label="Tax %" value={item.taxPct} onChange={(v) => update(i, { taxPct: v })} />
                <div className="self-end text-right text-sm">
                  <div className="text-[10px] text-muted-foreground">Line total</div>
                  <div className="font-semibold tabular-nums">{formatCurrency(lineTotal(item))}</div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">Add a line item above.</div>
          ) : null}
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea className="mt-1.5" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div>
          <Label>Terms &amp; conditions</Label>
          <Textarea className="mt-1.5" rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 text-sm">
          <div className="flex gap-4">
            <span className="text-muted-foreground">Grand total</span>
            <span className="font-display text-lg font-semibold tabular-nums">{formatCurrency(totals.grandTotal)}</span>
          </div>
          <div className="text-success">{formatCurrency(totals.profitAmount)} · {totals.marginPct.toFixed(1)}% margin</div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button variant="gradient" onClick={save} disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-[10px]">{label}</Label>
      <Input className="mt-1 h-9 tabular-nums" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
