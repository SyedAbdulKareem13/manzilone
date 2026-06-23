import * as Lucide from "lucide-react";
import { cn } from "@/lib/utils";

type IconName = keyof typeof Lucide;

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = (Lucide as any)[name as IconName] ?? Lucide.Circle;
  return <Cmp className={cn("h-4 w-4", className)} aria-hidden />;
}
