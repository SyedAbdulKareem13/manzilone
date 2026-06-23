import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const rfq = await prisma.rFQ.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      customer: true,
      opportunity: true,
      lineItems: { orderBy: { position: "asc" } },
      quotations: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!rfq) notFound();

  return (
    <div>
      <Link href="/app/rfqs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All RFQs
      </Link>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>RFQ {rfq.rfqNumber}</CardTitle>
              <Badge variant="soft">{rfq.status.toLowerCase().replace("_", " ")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {rfq.customer.name}
              {rfq.opportunity ? ` · ${rfq.opportunity.oppNumber}` : ""}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <Info label="Currency" value={rfq.currency} />
            <Info label="Due" value={formatDate(rfq.dueDate)} />
            <Info label="Created" value={formatDate(rfq.createdAt)} />
            <Info label="Lines" value={String(rfq.lineItems.length)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/app/quotations/new?rfqId=${rfq.id}`}>
              <Button variant="gradient" className="w-full">
                <Receipt className="h-4 w-4" /> Generate quotation
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4" /> Upload document
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Grade / Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>UoM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.lineItems.map((l, i) => (
                  <TableRow key={l.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Badge variant="outline">{l.lineType.toLowerCase().replace("_", " ")}</Badge></TableCell>
                    <TableCell>{l.description}</TableCell>
                    <TableCell>{l.manpowerGrade ?? l.licenseProduct ?? "—"}</TableCell>
                    <TableCell className="text-right">{Number(l.quantity)}</TableCell>
                    <TableCell>{l.uom ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
