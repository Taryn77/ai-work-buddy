import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white", tint)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
