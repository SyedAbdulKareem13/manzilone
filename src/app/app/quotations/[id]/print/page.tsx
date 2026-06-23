import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintTrigger, PrintButton } from "@/components/print/print-trigger";

export const dynamic = "force-dynamic";

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const q = await prisma.quotation.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      customer: true,
      rfq: true,
      organization: true,
      items: { orderBy: { position: "asc" } },
      positions: true,
    },
  });
  if (!q) notFound();

  const currency = q.currency || "INR";
  const fc = (v: number | string | null | undefined) => formatCurrency(v, currency);

  return (
    <div className="print-root">
      <PrintTrigger />
      <style>{printCss}</style>

      {/* Screen-only toolbar */}
      <div className="no-print toolbar">
        <Link href={`/app/quotations/${q.id}`} className="toolbar-back">
          <ArrowLeft className="h-4 w-4" /> Back to quotation
        </Link>
        <PrintButton className="toolbar-print">
          <FileDown className="h-4 w-4" /> Download / Print PDF
        </PrintButton>
      </div>

      <div className="sheet">
        {/* Letterhead */}
        <header className="letterhead">
          <div className="brand">
            <span className="najm-tile" aria-hidden>
              <svg viewBox="0 0 200 200" className="najm-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="najmGradQ" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFE9C2" />
                    <stop offset="0.45" stopColor="#FF8A65" />
                    <stop offset="1" stopColor="#FF5C5C" />
                  </linearGradient>
                </defs>
                <path
                  d="M100 10 C108 72 128 92 190 100 C128 108 108 128 100 190 C92 128 72 108 10 100 C72 92 92 72 100 10 Z"
                  fill="url(#najmGradQ)"
                />
              </svg>
            </span>
            <div className="brand-text">
              <div className="brand-word">
                Manzil <span className="brand-one">One</span>
              </div>
              <div className="brand-sub">CRM Suite</div>
            </div>
          </div>
          <div className="org-block">
            <div className="org-name">{q.organization.name}</div>
            {q.organization.country ? <div className="org-line">{q.organization.country}</div> : null}
          </div>
        </header>

        <div className="doc-title-row">
          <div>
            <div className="doc-kicker">Quotation</div>
            <h1 className="doc-title">{q.quotationNumber}</h1>
            <div className="doc-meta">
              Version {q.version} · {q.status.toLowerCase().replace(/_/g, " ")}
              {q.rfq ? ` · linked to ${q.rfq.rfqNumber}` : ""}
            </div>
          </div>
          <table className="meta-mini">
            <tbody>
              <tr>
                <td className="mm-label">Date</td>
                <td className="mm-value">{formatDate(q.createdAt)}</td>
              </tr>
              <tr>
                <td className="mm-label">Valid until</td>
                <td className="mm-value">{formatDate(q.validUntil)}</td>
              </tr>
              <tr>
                <td className="mm-label">Currency</td>
                <td className="mm-value">{currency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer block */}
        <section className="party-grid">
          <div className="party">
            <div className="party-label">Prepared for</div>
            <div className="party-name">{q.customer.name}</div>
            {q.customer.industry ? <div className="party-line">{q.customer.industry}</div> : null}
            {q.customer.billingAddress ? (
              <div className="party-line party-address">{q.customer.billingAddress}</div>
            ) : null}
            {q.customer.gstNumber ? <div className="party-line">GST: {q.customer.gstNumber}</div> : null}
          </div>
          <div className="party">
            <div className="party-label">Prepared by</div>
            <div className="party-name">{q.organization.name}</div>
            {q.organization.industry ? <div className="party-line">{q.organization.industry}</div> : null}
            {q.organization.country ? <div className="party-line">{q.organization.country}</div> : null}
          </div>
        </section>

        {/* Line items */}
        <table className="items">
          <thead>
            <tr>
              <th className="c-num">#</th>
              <th className="c-type">Type</th>
              <th className="c-desc">Description</th>
              <th className="c-r">Qty</th>
              <th className="c-r">Unit cost</th>
              <th className="c-r">Markup</th>
              <th className="c-r">Disc.</th>
              <th className="c-r">Tax</th>
              <th className="c-r">Line total</th>
            </tr>
          </thead>
          <tbody>
            {q.items.map((it, i) => (
              <tr key={it.id}>
                <td className="c-num">{i + 1}</td>
                <td className="c-type">{it.itemType.toLowerCase().replace(/_/g, " ")}</td>
                <td className="c-desc">{it.description}</td>
                <td className="c-r">{Number(it.quantity)}</td>
                <td className="c-r">{fc(Number(it.unitCost))}</td>
                <td className="c-r">{Number(it.markupPct)}%</td>
                <td className="c-r">{Number(it.discountPct)}%</td>
                <td className="c-r">{Number(it.taxPct)}%</td>
                <td className="c-r c-strong">{fc(Number(it.lineTotal))}</td>
              </tr>
            ))}
            {q.items.length === 0 ? (
              <tr>
                <td className="c-empty" colSpan={9}>
                  No line items.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* Positions + totals */}
        <section className="summary-grid">
          <div className="positions">
            <div className="block-title">Position determination</div>
            {q.positions.length === 0 ? (
              <div className="muted">No positions estimated.</div>
            ) : (
              <table className="pos-table">
                <tbody>
                  {q.positions.map((p) => (
                    <tr key={p.id}>
                      <td className="pos-role">
                        {p.headcount}× {p.designation}
                        {p.experience ? ` (${p.experience})` : ""}
                      </td>
                      <td className="pos-rev">{fc(Number(p.revenue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="totals">
            <TotalRow label="Base cost" value={fc(Number(q.baseCost))} />
            <TotalRow label="Markup" value={fc(Number(q.markupAmount))} />
            <TotalRow label="Discount" value={`-${fc(Number(q.discountAmount))}`} />
            <TotalRow label="Tax" value={fc(Number(q.taxAmount))} />
            <div className="totals-rule" />
            <TotalRow label="Grand total" value={fc(Number(q.grandTotal))} strong />
          </div>
        </section>

        {/* Terms */}
        {q.termsAndConditions ? (
          <section className="terms">
            <div className="block-title">Terms &amp; Conditions</div>
            <p className="terms-body">{q.termsAndConditions}</p>
          </section>
        ) : null}

        {q.notes ? (
          <section className="terms">
            <div className="block-title">Notes</div>
            <p className="terms-body">{q.notes}</p>
          </section>
        ) : null}

        <footer className="doc-footer">
          <span>{q.organization.name}</span>
          <span>
            {q.quotationNumber} · v{q.version}
          </span>
          <span>Generated {formatDate(new Date())}</span>
        </footer>
      </div>
    </div>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`total-row${strong ? " total-strong" : ""}`}>
      <span className="total-label">{label}</span>
      <span className="total-value">{value}</span>
    </div>
  );
}

const printCss = `
  .print-root { --ink: #14151A; --soft: #5b606b; --line: #e3e5ea; --accent: #FF6B4A; --tile-a: #2A2D34; --tile-b: #0B0C10; }
  .print-root { background: #f4f5f7; min-height: 100vh; color: var(--ink); }
  .print-root * { box-sizing: border-box; }

  .toolbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
  .toolbar-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--soft); text-decoration: none; }
  .toolbar-back:hover { color: var(--ink); }
  .toolbar-print { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #fff; border: 0; border-radius: 10px; padding: 9px 16px; cursor: pointer; background: linear-gradient(135deg, #FF8A65, #FF5C5C); box-shadow: 0 8px 20px -8px rgba(255,92,92,0.55); }

  .sheet { background: #fff; color: var(--ink); width: 210mm; max-width: 100%; min-height: 297mm; margin: 24px auto; padding: 18mm; box-shadow: 0 20px 60px -30px rgba(15,16,20,0.45); border-radius: 4px; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 12px; line-height: 1.5; }

  .letterhead { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid var(--ink); }
  .brand { display: flex; align-items: center; gap: 12px; }
  .najm-tile { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 12px; background: radial-gradient(120% 120% at 30% 20%, var(--tile-a) 0%, #14151A 55%, var(--tile-b) 100%); }
  .najm-svg { width: 62%; height: 62%; }
  .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
  .brand-word { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
  .brand-one { color: var(--accent); }
  .brand-sub { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--soft); margin-top: 3px; }
  .org-block { text-align: right; }
  .org-name { font-size: 13px; font-weight: 600; }
  .org-line { font-size: 11px; color: var(--soft); }

  .doc-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-top: 18px; }
  .doc-kicker { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); }
  .doc-title { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 2px 0 0; }
  .doc-meta { font-size: 11px; color: var(--soft); margin-top: 4px; text-transform: capitalize; }
  .meta-mini { border-collapse: collapse; font-size: 11px; }
  .meta-mini td { padding: 2px 0; }
  .mm-label { color: var(--soft); padding-right: 14px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 9px; }
  .mm-value { text-align: right; font-weight: 600; }

  .party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
  .party { border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; }
  .party-label { font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--soft); }
  .party-name { font-size: 13px; font-weight: 600; margin-top: 4px; }
  .party-line { font-size: 11px; color: var(--soft); margin-top: 2px; }
  .party-address { white-space: pre-wrap; }

  .items { width: 100%; border-collapse: collapse; margin-top: 22px; }
  .items thead th { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--soft); text-align: left; padding: 8px 8px; border-bottom: 1.5px solid var(--ink); }
  .items tbody td { font-size: 11px; padding: 8px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
  .items tbody tr:nth-child(even) td { background: #fafbfc; }
  .c-r { text-align: right; white-space: nowrap; }
  .c-num { width: 26px; color: var(--soft); }
  .c-type { text-transform: capitalize; white-space: nowrap; }
  .c-desc { width: 36%; }
  .c-strong { font-weight: 700; }
  .c-empty { text-align: center; color: var(--soft); padding: 18px 0; }

  .summary-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; margin-top: 22px; align-items: start; }
  .block-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--soft); margin-bottom: 8px; }
  .pos-table { width: 100%; border-collapse: collapse; }
  .pos-table td { font-size: 11px; padding: 4px 0; border-bottom: 1px solid var(--line); }
  .pos-role { color: var(--ink); }
  .pos-rev { text-align: right; color: var(--soft); white-space: nowrap; }
  .muted { font-size: 11px; color: var(--soft); }

  .totals { border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; background: #fafbfc; }
  .total-row { display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 3px 0; }
  .total-label { color: var(--soft); }
  .total-value { font-weight: 600; }
  .totals-rule { height: 1px; background: var(--line); margin: 6px 0; }
  .total-strong { font-size: 14px; }
  .total-strong .total-label { color: var(--ink); font-weight: 700; }
  .total-strong .total-value { font-weight: 700; }

  .terms { margin-top: 22px; }
  .terms-body { font-size: 11px; color: var(--soft); white-space: pre-wrap; margin: 0; }

  .doc-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 9px; color: var(--soft); }

  @media print {
    .print-root { background: #fff; }
    .no-print { display: none !important; }
    .sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
    .items tbody tr { page-break-inside: avoid; }
    .party, .totals, .terms { page-break-inside: avoid; }
    @page { size: A4; margin: 18mm; }
  }
`;
