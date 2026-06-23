import { prisma } from "@/lib/prisma";

export async function getDashboardData(organizationId: string) {
  const [
    totalLeads,
    openOpps,
    wonOpps,
    lostOpps,
    rfqsPending,
    quotationsSubmitted,
    pipelineAgg,
    revenueForecastAgg,
    leadSources,
    recentActivities,
    upcomingTasks,
    recentQuotations,
    recentOpportunities,
    monthlyWins,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId } }),
    prisma.opportunity.count({
      where: { organizationId, NOT: { stage: { in: ["WON", "LOST"] } } },
    }),
    prisma.opportunity.count({ where: { organizationId, stage: "WON" } }),
    prisma.opportunity.count({ where: { organizationId, stage: "LOST" } }),
    prisma.rFQ.count({
      where: { organizationId, status: { in: ["DRAFT", "RECEIVED", "IN_PROGRESS"] } },
    }),
    prisma.quotation.count({
      where: {
        organizationId,
        status: { in: ["SENT", "APPROVED", "PENDING_APPROVAL"] },
      },
    }),
    prisma.opportunity.aggregate({
      where: { organizationId, NOT: { stage: { in: ["WON", "LOST"] } } },
      _sum: { expectedRevenue: true },
    }),
    prisma.opportunity.findMany({
      where: { organizationId, NOT: { stage: "LOST" } },
      select: { expectedRevenue: true, probability: true, stage: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.activity.findMany({
      where: { organizationId },
      include: { owner: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.activity.findMany({
      where: {
        organizationId,
        status: "PLANNED",
        dueAt: { gte: new Date() },
      },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.quotation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.opportunity.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.opportunity.findMany({
      where: { organizationId, stage: "WON" },
      select: { expectedRevenue: true, updatedAt: true },
    }),
  ]);

  const pipelineValue = Number(pipelineAgg._sum.expectedRevenue ?? 0);

  const revenueForecast = revenueForecastAgg.reduce((acc, o) => {
    return acc + Number(o.expectedRevenue) * (o.probability / 100);
  }, 0);

  const winRate =
    wonOpps + lostOpps > 0
      ? Math.round((wonOpps / (wonOpps + lostOpps)) * 100)
      : 0;

  // monthly revenue for last 6 months
  const months: { month: string; revenue: number; deals: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-IN", { month: "short" });
    const total = monthlyWins
      .filter(
        (w) =>
          w.updatedAt.getMonth() === d.getMonth() &&
          w.updatedAt.getFullYear() === d.getFullYear()
      )
      .reduce((a, b) => a + Number(b.expectedRevenue), 0);
    const deals = monthlyWins.filter(
      (w) =>
        w.updatedAt.getMonth() === d.getMonth() &&
        w.updatedAt.getFullYear() === d.getFullYear()
    ).length;
    months.push({ month: key, revenue: total, deals });
  }

  // sales funnel
  const funnel = await prisma.opportunity.groupBy({
    by: ["stage"],
    where: { organizationId },
    _count: { _all: true },
    _sum: { expectedRevenue: true },
  });

  return {
    kpi: {
      totalLeads,
      openOpps,
      wonOpps,
      lostOpps,
      rfqsPending,
      quotationsSubmitted,
      revenueForecast,
      pipelineValue,
      winRate,
    },
    leadSources: leadSources.map((l) => ({
      source: l.source,
      count: l._count._all,
    })),
    monthlyRevenue: months,
    funnel: funnel.map((f) => ({
      stage: f.stage,
      count: f._count._all,
      value: Number(f._sum.expectedRevenue ?? 0),
    })),
    recentActivities,
    upcomingTasks,
    recentQuotations,
    recentOpportunities,
  };
}
