"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronRight, ShieldCheck, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/utils";

type Step = {
  id: string;
  stepNumber: number;
  label: string;
  status: string;
  comments: string | null;
  actedAt: string | null;
};

type Request = {
  id: string;
  status: string;
  currentStep: number;
  steps: Step[];
};

export function ApprovalPanel({
  quotationId,
  status,
  request,
}: {
  quotationId: string;
  status: string;
  request: Request | null;
}) {
  const router = useRouter();
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  async function act(action: "SUBMIT" | "APPROVE" | "REJECT") {
    setLoading(true);
    const res = await fetch(`/api/quotations/${quotationId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comments }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success(action === "SUBMIT" ? "Submitted for approval" : action === "APPROVE" ? "Approved" : "Rejected");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Approval workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {request ? (
          <ol className="relative space-y-3">
            {request.steps.map((step) => {
              const variant =
                step.status === "APPROVED"
                  ? "success"
                  : step.status === "REJECTED"
                  ? "destructive"
                  : step.stepNumber === request.currentStep
                  ? "warning"
                  : "outline";
              return (
                <li key={step.id} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      step.status === "APPROVED"
                        ? "bg-success/20 text-success"
                        : step.status === "REJECTED"
                        ? "bg-destructive/20 text-destructive"
                        : step.stepNumber === request.currentStep
                        ? "bg-warning/20 text-warning"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.status === "APPROVED" ? <Check className="h-3.5 w-3.5" /> : step.status === "REJECTED" ? <X className="h-3.5 w-3.5" /> : step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {step.label}
                      <Badge variant={variant}>{step.status.toLowerCase()}</Badge>
                    </div>
                    {step.comments ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{step.comments}</p>
                    ) : null}
                    {step.actedAt ? (
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatRelativeTime(step.actedAt)}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No approval started yet.</p>
        )}

        {status !== "REJECTED" && request?.status !== "REJECTED" ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="text-sm"
            />
            {!request ? (
              <Button onClick={() => act("SUBMIT")} disabled={loading} className="w-full" variant="gradient">
                Submit for approval <ChevronRight className="h-4 w-4" />
              </Button>
            ) : request.status === "PENDING" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => act("REJECT")} disabled={loading} variant="destructive">
                  Reject
                </Button>
                <Button onClick={() => act("APPROVE")} disabled={loading} variant="gradient">
                  Approve step
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
