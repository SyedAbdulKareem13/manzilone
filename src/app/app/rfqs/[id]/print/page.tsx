import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PrintTrigger, PrintButton } from "@/components/print/print-trigger";

export const dynamic = "force-dynamic";

export default async function RFQPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const rfq = await prisma.rFQ.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      customer: true,
      organization: true,
      opportunity: true,
      lineItems: { orderBy: { position: "asc" } },
    },
  });
  if (!rfq) notFound();

  return (
    <div className="print-root">
      <PrintTrigger />
      <style>{printCss}</style>

      {/* Screen-only toolbar */}
      <div className="no-print toolbar">
        <Link href={`/app/rfqs/${rfq.id}`} className="toolbar-back">
          <ArrowLeft className="h-4 w-4" /> Back to RFQ
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
                  <linearGradient id="najmGradR" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFE9C2" />
                    <stop offset="0.45" stopColor="#FF8A65" />
                    <stop offset="1" stopColor="#FF5C5C" />
                  </linearGradient>
                </defs>
                <path
                  d="M100 10 C108 72 128 92 190 100 C128 108 108 128 100 190 C92 128 72 108 10 100 C72 92 92 72 100 10 Z"
                  fill="url(#najmGradR)"
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
            <div className="org-name">{rfq.organization.name}</div>
            {rfq.organization.country ? <div className="org-line">{rfq.organization.country}</div> : null}
          </div>
        </header>

        <div className="doc-title-row">
          <div>
            <div className="doc-kicker">Request for Quotation</div>
            <h1 className="doc-title">{rfq.rfqNumber}</h1>
            <div className="doc-meta">
              {rfq.status.toLowerCase().replace(/_/g, " ")}
              {rfq.opportunity ? ` · ${rfq.opportunity.oppNumber}` : ""}
            </div>
          </div>
          <table className="meta-mini">
            <tbody>
              <tr>
                <td className="mm-label">RFQ date</td>
                <td className="mm-value">{formatDate(rfq.rfqDate)}</td>
              </tr>
              <tr>
                <td className="mm-label">Due date</td>
                <td className="mm-value">{formatDate(rfq.dueDate)}</td>
              </tr>
              <tr>
                <td className="mm-label">Currency</td>
                <td className="mm-value">{rfq.currency}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer block */}
        <section className="party-grid">
          <div className="party">
            <div className="party-label">Issued to</div>
            <div className="party-name">{rfq.customer.name}</div>
            {rfq.customer.industry ? <div className="party-line">{rfq.customer.industry}</div> : null}
            {rfq.customer.billingAddress ? (
              <div className="party-line party-address">{rfq.customer.billingAddress}</div>
            ) : null}
            {rfq.customer.gstNumber ? <div className="party-line">GST: {rfq.customer.gstNumber}</div> : null}
          </div>
          <div className="party">
            <div className="party-label">Issued by</div>
            <div className="party-name">{rfq.organization.name}</div>
            {rfq.organization.industry ? <div className="party-line">{rfq.organization.industry}</div> : null}
            {rfq.organization.country ? <div className="party-line">{rfq.organization.country}</div> : null}
          </div>
        </section>

        {/* Line items */}
        <table className="items">
          <thead>
            <tr>
              <th className="c-num">#</th>
              <th className="c-type">Type</th>
              <th className="c-desc">Description</th>
              <th className="c-grade">Grade / Product</th>
              <th className="c-r">Qty</th>
              <th className="c-uom">UoM</th>
            </tr>
          </thead>
          <tbody>
            {rfq.lineItems.map((l, i) => (
              <tr key={l.id}>
                <td className="c-num">{i + 1}</td>
                <td className="c-type">{l.lineType.toLowerCase().replace(/_/g, " ")}</td>
                <td className="c-desc">{l.description}</td>
                <td className="c-grade">{l.manpowerGrade ?? l.licenseProduct ?? "—"}</td>
                <td className="c-r">{Number(l.quantity)}</td>
                <td className="c-uom">{l.uom ?? "—"}</td>
              </tr>
            ))}
            {rfq.lineItems.length === 0 ? (
              <tr>
                <td className="c-empty" colSpan={6}>
                  No line items.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* Terms / remarks */}
        {rfq.terms ? (
          <section className="terms">
            <div className="block-title">Terms &amp; Conditions</div>
            <p className="terms-body">{rfq.terms}</p>
          </section>
        ) : null}

        {rfq.remarks ? (
          <section className="terms">
            <div className="block-title">Remarks</div>
            <p className="terms-body">{rfq.remarks}</p>
          </section>
        ) : null}

        <footer className="doc-footer">
          <span>{rfq.organization.name}</span>
          <span>{rfq.rfqNumber}</span>
          <span>Generated {formatDate(new Date())}</span>
        </footer>
      </div>
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
  .c-desc { width: 40%; }
  .c-grade { width: 22%; }
  .c-uom { white-space: nowrap; }
  .c-empty { text-align: center; color: var(--soft); padding: 18px 0; }

  .block-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--soft); margin-bottom: 8px; }
  .terms { margin-top: 22px; }
  .terms-body { font-size: 11px; color: var(--soft); white-space: pre-wrap; margin: 0; }

  .doc-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 28px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 9px; color: var(--soft); }

  @media print {
    .print-root { background: #fff; }
    .no-print { display: none !important; }
    .sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
    .items tbody tr { page-break-inside: avoid; }
    .party, .terms { page-break-inside: avoid; }
    @page { size: A4; margin: 18mm; }
  }
`;
