"use client";

import { cn } from "@/lib/utils";
import type { ActivityLevel } from "@/lib/types/campaign";

interface ActivityIndicatorProps {
  level: ActivityLevel;
  lastActiveDate?: string | null;
  className?: string;
}

const activityConfig: Record<
  ActivityLevel,
  { label: string; dotClass: string; textClass: string }
> = {
  active: {
    label: "Active",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  low_activity: {
    label: "Low Activity",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
  },
  inactive: {
    label: "Inactive",
    dotClass: "bg-gray-400",
    textClass: "text-gray-500",
  },
};

export function ActivityIndicator({
  level,
  lastActiveDate,
  className,
}: ActivityIndicatorProps) {
  const config = activityConfig[level];

  return (
    <div
      className={cn("flex items-center gap-1.5 text-xs", className)}
      aria-label={`Activity level: ${config.label}`}
    >
      <span
        className={cn("inline-block h-1.5 w-1.5 rounded-full", config.dotClass)}
        aria-hidden="true"
      />
      <span className={config.textClass}>{config.label}</span>
      {level === "inactive" && lastActiveDate && (
        <span className="text-muted-foreground">
          (last: {new Date(lastActiveDate).toLocaleDateString()})
        </span>
      )}
    </div>
  );
}
