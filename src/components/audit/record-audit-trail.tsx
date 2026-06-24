import { History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditTrail, type AuditEntry } from "@/components/audit/audit-trail";

/** Server component: fetches and renders the audit trail for one record. */
export async function RecordAuditTrail({
  organizationId,
  entityType,
  entityId,
}: {
  organizationId: string;
  entityType: string;
  entityId: string;
}) {
  const rows = await prisma.auditLog.findMany({
    where: { organizationId, entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const entries: AuditEntry[] = rows.map((r) => ({
    id: r.id,
    entityType: r.entityType,
    entityId: r.entityId,
    entityLabel: r.entityLabel,
    action: r.action,
    summary: r.summary,
    changes: (r.changes as AuditEntry["changes"]) ?? null,
    actorName: r.actorName,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" /> Audit trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AuditTrail entries={entries} />
      </CardContent>
    </Card>
  );
}
