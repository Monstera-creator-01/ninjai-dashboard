"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlagSeverity } from "@/lib/types/flags";

interface SeverityBadgeProps {
  severity: FlagSeverity;
  className?: string;
}

const severityConfig: Record<
  FlagSeverity,
  { label: string; className: string }
> = {
  high: {
    label: "High",
    className:
      "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  medium: {
    label: "Medium",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
      aria-label={`Severity: ${config.label}`}
    >
      <span
        className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", {
          "bg-red-500": severity === "high",
          "bg-amber-500": severity === "medium",
        })}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}
