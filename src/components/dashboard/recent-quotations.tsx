import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCompactCurrency, formatRelativeTime } from "@/lib/utils";

const statusToVariant: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "soft" | "outline"> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  SENT: "info",
  ACCEPTED: "success",
  DECLINED: "destructive",
  EXPIRED: "outline",
};

export function RecentQuotations({
  quotations,
}: {
  quotations: Array<{
    id: string;
    quotationNumber: string;
    status: string;
    grandTotal: any;
    createdAt: Date;
    customer: { name: string };
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent quotations</CardTitle>
        <CardDescription>Latest pricing sent to customers</CardDescription>
      </CardHeader>
      <CardContent>
        {quotations.length === 0 ? (
          <EmptyState title="No quotations yet" description="Generate one from an RFQ." />
        ) : (
          <ul className="space-y-2">
            {quotations.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/app/quotations/${q.id}`}
                  className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--chart-2))/.2] to-[hsl(var(--chart-1))/.2] text-primary font-semibold text-xs">
                    {q.quotationNumber.split("-").pop()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{q.customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.quotationNumber} · {formatRelativeTime(q.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {formatCompactCurrency(Number(q.grandTotal))}
                    </div>
                    <Badge variant={statusToVariant[q.status] ?? "soft"} className="mt-0.5">
                      {q.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
