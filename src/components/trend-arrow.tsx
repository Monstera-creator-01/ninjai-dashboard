"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/lib/types/campaign";

interface TrendArrowProps {
  direction: TrendDirection | null;
  className?: string;
}

export function TrendArrow({ direction, className }: TrendArrowProps) {
  if (direction === null) {
    return (
      <span
        className={cn("text-xs text-muted-foreground", className)}
        aria-label="Not enough data for trends"
        title="Not enough data for trends"
      >
        --
      </span>
    );
  }

  if (direction === "up") {
    return (
      <span
        className={cn("inline-flex items-center text-emerald-600", className)}
        aria-label="Trending up"
      >
        <TrendingUp className="h-4 w-4" />
      </span>
    );
  }

  if (direction === "down") {
    return (
      <span
        className={cn("inline-flex items-center text-red-600", className)}
        aria-label="Trending down"
      >
        <TrendingDown className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center text-gray-400", className)}
      aria-label="Stable trend"
    >
      <Minus className="h-4 w-4" />
    </span>
  );
}
