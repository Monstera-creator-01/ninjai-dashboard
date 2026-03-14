"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/lib/types/campaign";

interface HealthBadgeProps {
  status: HealthStatus;
  className?: string;
}

const healthConfig: Record<
  HealthStatus,
  { label: string; className: string }
> = {
  green: {
    label: "Healthy",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  yellow: {
    label: "Needs Attention",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  red: {
    label: "Critical",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
};

export function HealthBadge({ status, className }: HealthBadgeProps) {
  const config = healthConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
      aria-label={`Health status: ${config.label}`}
    >
      <span
        className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", {
          "bg-emerald-500": status === "green",
          "bg-amber-500": status === "yellow",
          "bg-red-500": status === "red",
        })}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}
