import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompactCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const c = await prisma.customer.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      contacts: true,
      opportunities: { orderBy: { updatedAt: "desc" }, take: 10 },
      rfqs: { orderBy: { createdAt: "desc" }, take: 10 },
      quotations: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!c) notFound();

  return (
    <div>
      <Link href="/app/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All customers
      </Link>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{c.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{c.industry ?? "—"}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Info label="Country" value={c.country ?? "—"} />
            <Info label="Region" value={c.region ?? "—"} />
            <Info label="GST" value={c.gstNumber ?? "—"} />
            <Info label="Website" value={c.website ?? "—"} />
            <Info label="Billing" value={c.billingAddress ?? "—"} className="col-span-2" />
            <Info label="Shipping" value={c.shippingAddress ?? "—"} className="col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contacts</CardTitle></CardHeader>
          <CardContent>
            {c.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts.</p>
            ) : (
              <ul className="space-y-2">
                {c.contacts.map((p) => (
                  <li key={p.id} className="rounded-xl border p-3 text-sm">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.designation ?? "—"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.email ?? "—"} · {p.mobile ?? "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Engagement</CardTitle></CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <Section title="Opportunities">
              {c.opportunities.map((o) => (
                <Link key={o.id} href={`/app/opportunities/${o.id}`} className="block rounded-xl border p-2 hover:bg-accent/40">
                  <div className="text-sm font-medium">{o.name}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{o.oppNumber}</span>
                    <Badge variant="soft">{o.stage.toLowerCase().replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-1 text-xs">{formatCompactCurrency(Number(o.expectedRevenue))}</div>
                </Link>
              ))}
            </Section>
            <Section title="RFQs">
              {c.rfqs.map((r) => (
                <Link key={r.id} href={`/app/rfqs/${r.id}`} className="block rounded-xl border p-2 hover:bg-accent/40">
                  <div className="text-sm font-medium">{r.rfqNumber}</div>
                  <div className="text-xs text-muted-foreground">Due {formatDate(r.dueDate)}</div>
                </Link>
              ))}
            </Section>
            <Section title="Quotations">
              {c.quotations.map((q) => (
                <Link key={q.id} href={`/app/quotations/${q.id}`} className="block rounded-xl border p-2 hover:bg-accent/40">
                  <div className="text-sm font-medium">{q.quotationNumber}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCompactCurrency(Number(q.grandTotal))}</span>
                    <Badge variant="soft">{q.status.toLowerCase().replace("_", " ")}</Badge>
                  </div>
                </Link>
              ))}
            </Section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
