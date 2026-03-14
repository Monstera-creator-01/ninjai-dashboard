"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HealthBadge } from "@/components/health-badge";
import { ActivityIndicator } from "@/components/activity-indicator";
import { TrendArrow } from "@/components/trend-arrow";
import { ChevronRight } from "lucide-react";
import type { WorkspaceSummary } from "@/lib/types/campaign";

interface WorkspaceCardProps {
  workspace: WorkspaceSummary;
}

interface MetricRowProps {
  label: string;
  value: string;
  trend: React.ReactNode;
  subtext?: string;
}

function MetricRow({ label, value, trend, subtext }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        {subtext && (
          <span className="text-xs text-muted-foreground/70">{subtext}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums">{value}</span>
        {trend}
      </div>
    </div>
  );
}

export function WorkspaceCard({ workspace: ws }: WorkspaceCardProps) {
  return (
    <Link
      href={`/dashboard/campaigns/${encodeURIComponent(ws.workspace)}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      aria-label={`View details for ${ws.workspace}`}
    >
      <Card className="transition-colors hover:border-primary/30 hover:shadow-md cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg truncate">
                  {ws.workspace}
                </CardTitle>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
              </div>
              <ActivityIndicator
                level={ws.activityLevel}
                lastActiveDate={ws.lastActiveDate}
              />
            </div>
            <HealthBadge status={ws.healthStatus} className="shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y">
            <MetricRow
              label="Connections Sent"
              value={ws.connectionsSent7d.current.toLocaleString()}
              trend={<TrendArrow direction={ws.connectionsSent7d.trend} />}
              subtext={`${ws.connectionsSentLifetime.toLocaleString()} lifetime`}
            />
            <MetricRow
              label="Acceptance Rate"
              value={`${ws.acceptanceRate7d.current.toFixed(1)}%`}
              trend={<TrendArrow direction={ws.acceptanceRate7d.trend} />}
            />
            <MetricRow
              label="Messages Started"
              value={ws.messagesStarted7d.current.toLocaleString()}
              trend={<TrendArrow direction={ws.messagesStarted7d.trend} />}
            />
            <MetricRow
              label="Reply Rate"
              value={`${ws.replyRate7d.current.toFixed(1)}%`}
              trend={<TrendArrow direction={ws.replyRate7d.trend} />}
            />
            <MetricRow
              label="Replies Received"
              value={ws.repliesReceived7d.current.toLocaleString()}
              trend={<TrendArrow direction={ws.repliesReceived7d.trend} />}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
