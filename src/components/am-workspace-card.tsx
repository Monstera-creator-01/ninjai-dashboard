"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "@/components/health-badge";
import { ActivityIndicator } from "@/components/activity-indicator";
import { TrendArrow } from "@/components/trend-arrow";
import { ChevronRight, MessageSquare, AlertTriangle } from "lucide-react";
import type { AMWorkspaceCardData } from "@/lib/types/am-summary";

interface AMWorkspaceCardProps {
  workspace: AMWorkspaceCardData;
}

interface MetricRowProps {
  label: string;
  value: string;
  trend: React.ReactNode;
}

function MetricRow({ label, value, trend }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums">{value}</span>
        {trend}
      </div>
    </div>
  );
}

export function AMWorkspaceCard({ workspace: ws }: AMWorkspaceCardProps) {
  return (
    <Link
      href={`/dashboard/am-summary/${encodeURIComponent(ws.workspace)}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      aria-label={`View AM summary for ${ws.workspace}`}
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
              label="Connections (7d)"
              value={ws.connectionsSent7d.current.toLocaleString()}
              trend={<TrendArrow direction={ws.connectionsSent7d.trend} />}
            />
            <MetricRow
              label="Reply Rate"
              value={`${ws.replyRate7d.current.toFixed(1)}%`}
              trend={<TrendArrow direction={ws.replyRate7d.trend} />}
            />
            <MetricRow
              label="Replies"
              value={ws.repliesReceived7d.current.toLocaleString()}
              trend={<TrendArrow direction={ws.repliesReceived7d.trend} />}
            />
          </div>

          {/* Bottom badges row */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {ws.notableConversationsCount > 0 && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <MessageSquare className="h-3 w-3" aria-hidden="true" />
                {ws.notableConversationsCount} Notable
              </Badge>
            )}
            {ws.riskCount > 0 && (
              <Badge
                variant="outline"
                className="gap-1 text-xs bg-red-50 text-red-700 border-red-200"
              >
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                {ws.riskCount} {ws.riskCount === 1 ? "Risk" : "Risks"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
