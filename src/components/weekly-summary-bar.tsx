"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Link2,
  Mail,
  MessageSquare,
  BarChart3,
  Users,
} from "lucide-react";
import type { WeeklySummaryAggregate } from "@/lib/types/weekly-review";

interface WeeklySummaryBarProps {
  summary: WeeklySummaryAggregate;
}

export function WeeklySummaryBar({ summary }: WeeklySummaryBarProps) {
  const metrics = [
    {
      label: "Total Connections Sent",
      value: summary.totalConnectionsSent.toLocaleString(),
      icon: Link2,
    },
    {
      label: "Avg Acceptance Rate",
      value: `${summary.avgAcceptanceRate.toFixed(1)}%`,
      icon: BarChart3,
    },
    {
      label: "Total Messages Started",
      value: summary.totalMessagesStarted.toLocaleString(),
      icon: Mail,
    },
    {
      label: "Avg Reply Rate",
      value: `${summary.avgReplyRate.toFixed(1)}%`,
      icon: MessageSquare,
    },
    {
      label: "Total Replies",
      value: summary.totalReplies.toLocaleString(),
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.label}
            </CardTitle>
            <metric.icon
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              Across {summary.workspaceCount} workspace
              {summary.workspaceCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
