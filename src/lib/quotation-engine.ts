export type QuotationLineInput = {
  unitCost: number;
  quantity: number;
  markupPct?: number;
  discountPct?: number;
  taxPct?: number;
};

export function computeLine(line: QuotationLineInput) {
  const base = line.unitCost * line.quantity;
  const afterMarkup = base * (1 + (line.markupPct ?? 0) / 100);
  const afterDiscount = afterMarkup * (1 - (line.discountPct ?? 0) / 100);
  const tax = afterDiscount * ((line.taxPct ?? 0) / 100);
  const lineTotal = afterDiscount + tax;
  return { base, afterMarkup, afterDiscount, tax, lineTotal };
}

export function computeQuotation(
  lines: QuotationLineInput[],
  overrides?: { headerDiscountPct?: number }
) {
  let baseCost = 0;
  let markupAmount = 0;
  let discountAmount = 0;
  let taxAmount = 0;
  let subtotal = 0;

  for (const l of lines) {
    const c = computeLine(l);
    baseCost += c.base;
    markupAmount += c.afterMarkup - c.base;
    discountAmount += c.afterMarkup - c.afterDiscount;
    taxAmount += c.tax;
    subtotal += c.lineTotal;
  }

  const headerDiscount =
    subtotal * ((overrides?.headerDiscountPct ?? 0) / 100);
  const grandTotal = subtotal - headerDiscount;
  const profit = grandTotal - baseCost;
  const marginPct = grandTotal > 0 ? (profit / grandTotal) * 100 : 0;

  return {
    baseCost,
    markupAmount,
    discountAmount: discountAmount + headerDiscount,
    taxAmount,
    grandTotal,
    profitAmount: profit,
    marginPct,
  };
}
