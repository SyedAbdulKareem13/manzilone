"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConvertLeadButton({ leadId, disabled }: { leadId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const res = await fetch(`/api/leads/${leadId}/convert`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(data.error ?? "Failed");
    toast.success("Converted");
    router.push(`/app/opportunities/${data.opportunity.id}`);
  }
  return (
    <Button onClick={go} disabled={disabled || loading} variant="gradient">
      {loading ? "Converting…" : disabled ? "Already converted" : "Convert to opportunity"}{" "}
      {!disabled ? <ArrowRight className="h-4 w-4" /> : null}
    </Button>
  );
}
