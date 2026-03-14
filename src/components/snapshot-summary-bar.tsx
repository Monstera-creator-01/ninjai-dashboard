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
  Clock,
} from "lucide-react";
import type { SnapshotSummary } from "@/lib/types/campaign";

interface SnapshotSummaryBarProps {
  summary: SnapshotSummary;
  dataFreshness: string | null;
}

function formatFreshness(isoDate: string | null): string {
  if (!isoDate) return "No data uploaded";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Updated just now";
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  if (diffDays === 1) return "Updated 1 day ago";
  return `Updated ${diffDays} days ago`;
}

export function SnapshotSummaryBar({
  summary,
  dataFreshness,
}: SnapshotSummaryBarProps) {
  const metrics = [
    {
      label: "Connections Sent (7d)",
      value: summary.totalConnectionsSent7d.toLocaleString(),
      icon: Link2,
    },
    {
      label: "Avg Acceptance Rate (7d)",
      value: `${summary.avgAcceptanceRate7d.toFixed(1)}%`,
      icon: BarChart3,
    },
    {
      label: "Messages Started (7d)",
      value: summary.totalMessagesStarted7d.toLocaleString(),
      icon: Mail,
    },
    {
      label: "Avg Reply Rate (7d)",
      value: `${summary.avgReplyRate7d.toFixed(1)}%`,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                Across {summary.workspaceCount} workspace{summary.workspaceCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" aria-hidden="true" />
        <span>{formatFreshness(dataFreshness)}</span>
      </div>
    </div>
  );
}
