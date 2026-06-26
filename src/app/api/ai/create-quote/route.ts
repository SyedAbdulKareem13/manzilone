import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextQuotationNumber } from "@/lib/numbering";
import { computeQuotation } from "@/lib/quotation-engine";
import { recordAudit } from "@/lib/audit";
import { getGeminiKey, getGeminiModel } from "@/lib/app-config";
import { geminiGenerate } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MARKUP_PCT = 35;
const TAX_PCT = 18;

const schema = z.object({ prompt: z.string().min(8) });

type Role = { count: number; role: string };
type Parsed = { title: string; clientName: string; roles: Role[]; durationMonths: number; pricingModel: string };

function titleCase(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) =>
      /^[A-Z0-9&/.+-]{2,}$/.test(w) || /\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ");
}

/** Deterministic parser for the standard brief grammar:
 *  "<N>-month <scope> for a <client>; <c> <Role>, <c> <Role>; <PricingModel>." */
function parseBrief(text: string): Parsed {
  const t = text.replace(/\s+/g, " ").trim();

  let durationMonths = 0;
  const ym = t.match(/(\d+)\s*-?\s*year/i);
  const mm = t.match(/(\d+)\s*-?\s*month/i);
  if (ym) durationMonths = parseInt(ym[1], 10) * 12;
  else if (mm) durationMonths = parseInt(mm[1], 10);

  let pricingModel = "T&M";
  if (/fixed\s*price/i.test(t)) pricingModel = "Fixed Price";
  else if (/managed\s*services/i.test(t)) pricingModel = "Managed Services";
  else if (/t\s*&\s*m|time\s*(?:&|and)\s*material/i.test(t)) pricingModel = "T&M";

  // Scope / title + client (split on " for a/an ")
  let title = t;
  let clientName = "AI Draft Client";
  const forMatch = t.match(/\bfor an?\b/i);
  if (forMatch && forMatch.index !== undefined) {
    title = t.slice(0, forMatch.index).trim().replace(/[;,.]+$/, "");
    const after = t.slice(forMatch.index).replace(/^for an?\s+/i, "");
    const client = after.split(";")[0].trim().replace(/[;,.]+$/, "");
    if (client) clientName = titleCase(client);
  } else {
    title = t.split(";")[0].trim();
  }

  // Roles: pick the ";"-segment with the most "<n> <role>" comma-parts.
  const segs = t.split(";").map((s) => s.trim());
  let roles: Role[] = [];
  for (const seg of segs) {
    const parts = seg.split(",").map((p) => p.trim());
    const found: Role[] = [];
    for (const p of parts) {
      const m = p.match(/^(\d+)\s+(.+?)\s*$/);
      if (m) {
        const count = parseInt(m[1], 10);
        const role = m[2].replace(/[.]+$/, "").trim();
        if (count > 0 && role && !/month|year/i.test(role)) found.push({ count, role });
      }
    }
    if (found.length > roles.length) roles = found;
  }

  return { title: title || "AI-drafted engagement", clientName, roles, durationMonths, pricingModel };
}

/** Indicative monthly cost (INR) per role keyword. Order matters. */
function roleMonthlyRate(role: string): number {
  const r = role.toLowerCase();
  if (/(solution|cloud|enterprise)\s*architect|architect|tech(nical)?\s*lead|delivery (manager|lead)/.test(r)) return 450000;
  if (/project manager|program manager|\bpm\b|scrum master/.test(r)) return 350000;
  if (/data engineer|ai engineer|ml engineer/.test(r)) return 320000;
  if (/devops|sre|site reliability/.test(r)) return 300000;
  if (/consultant|business analyst|\bba\b|basis|functional/.test(r)) return 300000;
  if (/ui\/?ux|ux|designer/.test(r)) return 250000;
  if (/\bqa\b|test|quality/.test(r)) return 200000;
  if (/developer|engineer|programmer|full ?stack|back ?end|front ?end|flutter|servicenow|mobile/.test(r)) return 280000;
  return 280000;
}

const ROLE_ALIASES: Record<string, string> = {
  pm: "project manager",
  ba: "business analyst",
  qa: "quality assurance",
  dev: "developer",
  sa: "solution architect",
  po: "product owner",
};

function normRole(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9/ ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Normalize + expand abbreviations + singularize tokens for matching. */
function canonRole(s: string): string {
  return normRole(s)
    .split(" ")
    .map((t) => ROLE_ALIASES[t] ?? t)
    .join(" ")
    .split(" ")
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

type RateCard = { designation: string; monthlyRate: unknown };

// Common role tokens that don't distinguish a role on their own.
const GENERIC_TOKENS = new Set([
  "engineer", "developer", "consultant", "manager", "analyst", "lead",
  "specialist", "officer", "executive", "senior", "junior", "sr", "jr",
  "associate", "expert", "architect", "the", "of", "and",
]);

/** Resolve a role's monthly cost: closest manpower rate-card designation, else default. */
function resolveMonthlyRate(
  role: string,
  cards: RateCard[]
): { rate: number; source: "card" | "default"; matched?: string } {
  const r = canonRole(role);
  const rTokens = new Set(r.split(" ").filter(Boolean));
  let best: RateCard | null = null;
  let bestScore = 0;
  for (const c of cards) {
    const d = canonRole(c.designation);
    let score = 0;
    if (d === r) score = 100;
    else if (d && (r.includes(d) || d.includes(r))) score = 60 + Math.min(d.length, r.length);
    else {
      // Token overlap — but require a DISTINGUISHING (non-generic) shared token,
      // so "AI Engineer" doesn't match "QA Engineer" on "engineer" alone.
      let specific = 0;
      let generic = 0;
      for (const t of d.split(" ")) {
        if (t && rTokens.has(t)) (GENERIC_TOKENS.has(t) ? generic++ : specific++);
      }
      if (specific) score = 30 + specific * 16 + generic * 4;
      else if (generic >= 2) score = 22; // e.g. "senior developer" ↔ "developer senior"
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  if (best && bestScore >= 20) {
    const n = Number(best.monthlyRate);
    if (Number.isFinite(n) && n > 0) return { rate: n, source: "card", matched: best.designation };
  }
  return { rate: roleMonthlyRate(role), source: "default" };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = session.user.organizationId;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a brief." }, { status: 400 });

  const brief = parseBrief(parsed.data.prompt);
  if (!brief.roles.length || !brief.durationMonths) {
    return NextResponse.json(
      {
        error:
          "Couldn't read the brief. Use a format like: \"3-month Salesforce CRM implementation for a healthcare provider; 1 PM, 2 Developers, 1 QA; Fixed Price.\"",
        code: "parse",
      },
      { status: 422 }
    );
  }

  // Build positions + line items. Pull real monthly rates from the org's
  // manpower rate cards (closest designation match); fall back to defaults.
  const months = brief.durationMonths;
  const cards = await prisma.manpowerRateCard.findMany({
    where: { organizationId: orgId },
    select: { designation: true, monthlyRate: true },
  });
  const rated = brief.roles.map((r) => {
    const res = resolveMonthlyRate(r.role, cards);
    return { count: r.count, role: r.role, rate: res.rate, source: res.source };
  });
  const usedCards = rated.some((r) => r.source === "card");

  const positions = rated.map((r) => {
    const monthlyRate = r.rate;
    const monthlyBilling = Math.round(monthlyRate * (1 + MARKUP_PCT / 100));
    const cost = monthlyRate * r.count * months;
    const revenue = monthlyBilling * r.count * months;
    const margin = revenue - cost;
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
    return {
      designation: titleCase(r.role),
      headcount: r.count,
      durationMonths: months,
      monthlyRate,
      monthlyBilling,
      cost,
      revenue,
      margin,
      marginPct,
    };
  });

  const items = rated.map((r) => ({
    itemType: "MANPOWER" as const,
    description: `${r.count} × ${titleCase(r.role)} · ${months} mo`,
    quantity: r.count * months, // man-months
    uom: "man-month",
    unitCost: r.rate,
    markupPct: MARKUP_PCT,
    discountPct: 0,
    taxPct: TAX_PCT,
  }));

  const totals = computeQuotation(
    items.map((i) => ({ unitCost: i.unitCost, quantity: i.quantity, markupPct: i.markupPct, discountPct: i.discountPct, taxPct: i.taxPct }))
  );

  // Optional: a polished scope narrative via Gemini (skipped silently if the key is rate-limited / unset).
  let scopeNote = "";
  try {
    const key = await getGeminiKey();
    if (key) {
      scopeNote = await geminiGenerate({
        apiKey: key,
        model: await getGeminiModel(),
        system: "You are Manz AI inside a CRM. Write a crisp 2-3 sentence professional engagement scope. No preamble.",
        prompt: `Write the scope/approach paragraph for this engagement brief:\n"""${parsed.data.prompt}"""`,
        temperature: 0.5,
      });
    }
  } catch {
    /* AI optional — fall back to the structured note below */
  }

  // Find-or-create the customer from the brief's client descriptor.
  let customer = await prisma.customer.findFirst({
    where: { organizationId: orgId, name: brief.clientName },
    select: { id: true },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { organizationId: orgId, name: brief.clientName },
      select: { id: true },
    });
  }

  const quotationNumber = await nextQuotationNumber(orgId);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const notes = [
    brief.title,
    `Engagement: ${months} month${months === 1 ? "" : "s"} · ${brief.pricingModel}`,
    `Team: ${brief.roles.map((r) => `${r.count} ${titleCase(r.role)}`).join(", ")}`,
    `Rates: ${usedCards ? "matched to your manpower rate cards" : "indicative defaults"}`,
    scopeNote ? `\nScope: ${scopeNote}` : "",
    `\n— Drafted by Manz AI`,
  ]
    .filter(Boolean)
    .join("\n");

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      organizationId: orgId,
      customerId: customer.id,
      currency: "INR",
      status: "DRAFT",
      draftedByAi: true,
      validUntil,
      notes,
      termsAndConditions: `Pricing model: ${brief.pricingModel}. ${usedCards ? "Manpower rates sourced from your rate cards where a designation matched; any unmatched roles use indicative estimates." : "Rates are indicative AI estimates; validate against your rate cards before sending."}`,
      baseCost: totals.baseCost,
      markupAmount: totals.markupAmount,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      marginPct: totals.marginPct,
      profitAmount: totals.profitAmount,
      items: {
        create: items.map((i, idx) => {
          const base = i.unitCost * i.quantity;
          const afterMarkup = base * (1 + i.markupPct / 100);
          const afterDiscount = afterMarkup * (1 - i.discountPct / 100);
          const lineTotal = afterDiscount * (1 + i.taxPct / 100);
          return { ...i, position: idx, lineTotal };
        }),
      },
      positions: { create: positions },
    },
    select: { id: true, quotationNumber: true, grandTotal: true, currency: true },
  });

  await recordAudit({
    organizationId: orgId,
    entityType: "QUOTATION",
    entityId: quotation.id,
    entityLabel: quotation.quotationNumber,
    action: "CREATED",
    summary: `Drafted by Manz AI · ${brief.roles.reduce((n, r) => n + r.count, 0)} resources · ${months} mo · grand total ${Number(quotation.grandTotal).toLocaleString("en-IN")} ${quotation.currency}`,
    actorId: session.user.id,
    actorName: session.user.name,
  });

  return NextResponse.json({ id: quotation.id, quotationNumber: quotation.quotationNumber });
}
