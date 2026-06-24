import { redirect } from "next/navigation";
import { Rocket, Sparkles, Clock, CircleDashed } from "lucide-react";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RELEASES, ROADMAP, CURRENT_VERSION, type ChangeType } from "@/lib/releases";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_META: Record<ChangeType, { label: string; variant: any }> = {
  new: { label: "New", variant: "soft" },
  improved: { label: "Improved", variant: "info" },
  fixed: { label: "Fixed", variant: "success" },
};

export default async function ReleasesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <PageHeader
        title="Release Notes"
        urdu="نئی خصوصیات"
        description="Everything shipped to Manzil One, newest first — plus what's coming over the next two weeks."
        actions={
          <Badge variant="soft" className="gap-1.5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Current build v{CURRENT_VERSION}
          </Badge>
        }
      />

      {/* Releases timeline */}
      <div className="relative">
        <div className="absolute bottom-3 left-[15px] top-3 w-px bg-border" aria-hidden />
        <div className="space-y-5">
          {RELEASES.map((r, i) => {
            const latest = i === 0;
            return (
              <div key={r.version} className="relative flex gap-4">
                <span
                  className={
                    "relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full " +
                    (latest
                      ? "btn-gradient text-white shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.5)]"
                      : "border border-border bg-card text-muted-foreground")
                  }
                >
                  {latest ? <Rocket className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-primary/60" />}
                </span>
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <CardTitle className="text-base">v{r.version}</CardTitle>
                      {latest ? <Badge variant="default">Latest</Badge> : null}
                      <span className="text-sm font-medium text-foreground/80">· {r.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDate(r.date)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.summary}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {r.items.map((it, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm">
                          <Badge variant={TYPE_META[it.type].variant} className="mt-0.5 shrink-0">
                            {TYPE_META[it.type].label}
                          </Badge>
                          <span className="text-foreground/85">{it.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap */}
      <div className="mt-10">
        <div className="mb-1 flex items-baseline gap-3 flex-wrap">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Roadmap</h2>
          <span dir="rtl" className="font-urdu text-xl leading-none text-muted-foreground">روڈ میپ</span>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Planned for the next two weeks. Expect nightly pushes — items may ship earlier.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {ROADMAP.map((wk) => (
            <Card key={wk.week}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{wk.week}</CardTitle>
                  <span className="text-xs font-medium text-muted-foreground">{wk.range}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {wk.items.map((it) => (
                    <li key={it.title} className="flex items-start gap-3">
                      <span
                        className={
                          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg " +
                          (it.status === "in_progress"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {it.status === "in_progress" ? <Clock className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{it.title}</span>
                          <Badge variant={it.status === "in_progress" ? "warning" : "outline"}>
                            {it.status === "in_progress" ? "In progress" : "Planned"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{it.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Note: this is an early build hosted on Vercel for review. The final step will be an AWS deployment
          (Docker / Jenkins) for a more robust pipeline.
        </p>
      </div>
    </>
  );
}
