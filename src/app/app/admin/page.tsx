import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [users, territories, businessUnits, approvalChains] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.territory.findMany({ where: { organizationId: orgId } }),
    prisma.businessUnit.findMany({ where: { organizationId: orgId } }),
    prisma.approvalChain.findMany({ where: { organizationId: orgId }, include: { steps: { orderBy: { stepNumber: "asc" } } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Admin"
        description="Users, roles, territories, business units & approval chains."
      />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="territories">Territories</TabsTrigger>
          <TabsTrigger value="bus">Business units</TabsTrigger>
          <TabsTrigger value="chains">Approval chains</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>{users.length} users in your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            {u.image ? <AvatarImage src={u.image} alt="" /> : null}
                            <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                          </Avatar>
                          <span>{u.name ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><Badge variant="soft">{u.role.toLowerCase().replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "success" : "secondary"}>
                          {u.isActive ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(u.lastLoginAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="territories">
          <Card>
            <CardHeader><CardTitle>Territories</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {territories.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No territories yet.</span>
                ) : (
                  territories.map((t) => (
                    <Badge key={t.id} variant="outline" className="px-3 py-1">
                      {t.name}{t.region ? ` · ${t.region}` : ""}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bus">
          <Card>
            <CardHeader><CardTitle>Business units</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {businessUnits.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No business units yet.</span>
                ) : (
                  businessUnits.map((b) => (
                    <Badge key={b.id} variant="outline" className="px-3 py-1">{b.name}</Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chains">
          <Card>
            <CardHeader><CardTitle>Approval chains</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {approvalChains.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Default 4-step chain is used: Sales Executive → Sales Manager → Business Head → Finance.
                </p>
              ) : (
                approvalChains.map((c) => (
                  <div key={c.id} className="rounded-xl border p-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      {c.steps.map((s, i) => (
                        <span key={s.id} className="flex items-center gap-2">
                          <Badge variant="soft">{s.label}</Badge>
                          {i < c.steps.length - 1 ? <span className="text-muted-foreground">→</span> : null}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
