/**
 * Position Determination Engine.
 *
 * Given a list of role demands, compute cost, revenue, margin and profit
 * using the manpower rate card. Margin defaults to a configurable markup %.
 */

export type RoleDemand = {
  designation: string;
  grade?: string;
  experience?: string;
  headcount: number;
  durationMonths: number;
  monthlyRate: number;     // cost per resource per month
  markupPct?: number;      // billing markup on cost; default 35%
};

export type RoleEstimate = RoleDemand & {
  monthlyBilling: number;
  cost: number;
  revenue: number;
  margin: number;
  marginPct: number;
};

export function estimateRole(d: RoleDemand): RoleEstimate {
  const markup = d.markupPct ?? 35;
  const monthlyBilling = d.monthlyRate * (1 + markup / 100);
  const cost = d.headcount * d.durationMonths * d.monthlyRate;
  const revenue = d.headcount * d.durationMonths * monthlyBilling;
  const margin = revenue - cost;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
  return { ...d, monthlyBilling, cost, revenue, margin, marginPct };
}

export function estimateFleet(demands: RoleDemand[]) {
  const rows = demands.map(estimateRole);
  const totals = rows.reduce(
    (acc, r) => {
      acc.cost += r.cost;
      acc.revenue += r.revenue;
      acc.margin += r.margin;
      acc.headcount += r.headcount;
      return acc;
    },
    { cost: 0, revenue: 0, margin: 0, headcount: 0 }
  );
  const marginPct =
    totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0;
  return { rows, totals: { ...totals, marginPct } };
}
