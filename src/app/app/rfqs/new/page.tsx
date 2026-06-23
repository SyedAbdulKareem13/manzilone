import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { RfqForm } from "@/components/rfq/rfq-form";

export const dynamic = "force-dynamic";

export default async function NewRFQPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const { opportunityId } = await searchParams;

  const [customers, opportunities] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.opportunity.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, oppNumber: true, customerId: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="New RFQ"
        description="Capture a customer's RFQ and add line items by category — manpower, license, hardware, services."
      />
      <RfqForm
        customers={customers}
        opportunities={opportunities}
        defaultOpportunityId={opportunityId ?? null}
      />
    </>
  );
}
