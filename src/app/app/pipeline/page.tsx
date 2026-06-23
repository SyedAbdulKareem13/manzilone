import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const opps = await prisma.opportunity.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      customer: { select: { name: true } },
      owner: { select: { name: true, image: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Drag deals across stages — values, probability and aging update live."
      />
      <PipelineBoard initialOpportunities={JSON.parse(JSON.stringify(opps))} />
    </>
  );
}
