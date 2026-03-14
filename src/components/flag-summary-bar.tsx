"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Eye } from "lucide-react";
import type { FlagSummary } from "@/lib/types/flags";

interface FlagSummaryBarProps {
  summary: FlagSummary;
}

export function FlagSummaryBar({ summary }: FlagSummaryBarProps) {
  const metrics = [
    {
      label: "High Severity",
      value: summary.activeHighCount,
      icon: AlertTriangle,
      description: "Active high-severity flags",
      iconColor: "text-red-500",
    },
    {
      label: "Medium Severity",
      value: summary.activeMediumCount,
      icon: AlertCircle,
      description: "Active medium-severity flags",
      iconColor: "text-amber-500",
    },
    {
      label: "Acknowledged",
      value: summary.acknowledgedCount,
      icon: Eye,
      description: "Flags seen but not resolved",
      iconColor: "text-blue-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.label}
            </CardTitle>
            <metric.icon
              className={cn("h-4 w-4", metric.iconColor)}
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
