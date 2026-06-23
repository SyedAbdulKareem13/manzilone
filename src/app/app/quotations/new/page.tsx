import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { QuotationBuilder } from "@/components/quotation/quotation-builder";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ rfqId?: string; customerId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;
  const { rfqId, customerId: customerIdParam } = await searchParams;

  const [customers, manpower, nonManpower, license, rfq] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.manpowerRateCard.findMany({ where: { organizationId: orgId } }),
    prisma.nonManpowerRateCard.findMany({ where: { organizationId: orgId } }),
    prisma.licenseRateCard.findMany({ where: { organizationId: orgId } }),
    rfqId
      ? prisma.rFQ.findFirst({
          where: { id: rfqId, organizationId: orgId },
          include: { lineItems: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        title="New quotation"
        description="Compose pricing from manpower, license & non-manpower rate cards. The position engine estimates cost, revenue and margin in real time."
      />
      <QuotationBuilder
        customers={customers}
        manpower={JSON.parse(JSON.stringify(manpower))}
        nonManpower={JSON.parse(JSON.stringify(nonManpower))}
        license={JSON.parse(JSON.stringify(license))}
        defaultCustomerId={rfq?.customerId ?? customerIdParam ?? null}
        rfq={rfq ? JSON.parse(JSON.stringify(rfq)) : null}
      />
    </>
  );
}
