"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import { HealthBadge } from "@/components/health-badge";
import { SenderBreakdownTable } from "@/components/sender-breakdown-table";

const FunnelChart = dynamic(
  () => import("@/components/funnel-chart").then((mod) => mod.FunnelChart),
  { ssr: false, loading: () => <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Loading chart...</div> }
);
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Eye,
  MessageSquare,
  Link2,
  Users,
  AlertTriangle,
  TrendingDown,
  Target,
} from "lucide-react";
import type { WorkspaceWeeklySummary } from "@/lib/types/weekly-review";
import type { WowChange } from "@/lib/types/weekly-review";
import { FLAG_TYPE_LABELS } from "@/lib/types/flags";

interface WorkspaceWeeklyCardProps {
  workspace: WorkspaceWeeklySummary;
}

function WowIndicator({
  change,
  isPercent = false,
}: {
  change: WowChange;
  isPercent?: boolean;
}) {
  if (change.changePercent === null) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  const sign = change.changePercent > 0 ? "+" : "";
  const text = `${sign}${change.changePercent.toFixed(1)}%`;

  return (
    <span
      className={cn("text-xs font-medium", {
        "text-emerald-600": change.direction === "up",
        "text-red-600": change.direction === "down",
        "text-muted-foreground": change.direction === "stable",
      })}
      aria-label={`Change: ${text}`}
    >
      {text}
      {isPercent && change.previous !== null && (
        <span className="text-muted-foreground font-normal ml-1">
          (was {change.previous.toFixed(1)}%)
        </span>
      )}
    </span>
  );
}

function MetricRow({
  label,
  value,
  change,
  isPercent = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: WowChange;
  isPercent?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold tabular-nums">{value}</span>
        <WowIndicator change={change} isPercent={isPercent} />
      </div>
    </div>
  );
}

export function WorkspaceWeeklyCard({ workspace: ws }: WorkspaceWeeklyCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg truncate">
                    {ws.workspace}
                  </CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </div>
                {ws.isPartialWeek && (
                  <span className="text-xs text-amber-600">
                    Data covers {ws.daysWithData} of 7 days
                  </span>
                )}
              </div>
              <HealthBadge status={ws.healthStatus} className="shrink-0" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        {/* Always visible: key metrics */}
        <CardContent className="pt-0">
          <div className="divide-y">
            <MetricRow
              label="Connections Sent"
              value={ws.metrics.connectionsSent.toLocaleString()}
              change={ws.wow.connectionsSent}
              icon={Link2}
            />
            <MetricRow
              label="Acceptance Rate"
              value={`${ws.metrics.acceptanceRate.toFixed(1)}%`}
              change={ws.wow.acceptanceRate}
              isPercent
              icon={Users}
            />
            <MetricRow
              label="Messages Started"
              value={ws.metrics.messagesStarted.toLocaleString()}
              change={ws.wow.messagesStarted}
              icon={MessageSquare}
            />
            <MetricRow
              label="Reply Rate"
              value={`${ws.metrics.replyRate.toFixed(1)}%`}
              change={ws.wow.replyRate}
              isPercent
              icon={MessageSquare}
            />
            <MetricRow
              label="Replies Received"
              value={ws.metrics.repliesReceived.toLocaleString()}
              change={ws.wow.repliesReceived}
              icon={MessageSquare}
            />
          </div>
        </CardContent>

        {/* Expanded content */}
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            <Separator />

            {/* Engagement metrics */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Engagement</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Profile Views</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">
                      {ws.metrics.profileViews.toLocaleString()}
                    </span>
                    <WowIndicator change={ws.wow.profileViews} />
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Follows</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">
                      {ws.metrics.follows.toLocaleString()}
                    </span>
                    <WowIndicator change={ws.wow.follows} />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Funnel visualization */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Outreach Funnel</h4>
              <FunnelChart stages={ws.funnel} />
            </div>

            <Separator />

            {/* Sender breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Sender Activity</h4>
              <SenderBreakdownTable senders={ws.senders} />
            </div>

            {/* Recommended actions (from intervention flags) */}
            {ws.activeFlags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    Recommended Actions
                  </h4>
                  <div className="space-y-2">
                    {ws.activeFlags.map((flag) => (
                      <div
                        key={flag.id}
                        className="rounded-md border border-amber-200 bg-amber-50/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">
                              {FLAG_TYPE_LABELS[flag.flag_type]}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" aria-hidden="true" />
                                Triggered: {flag.triggered_value}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" aria-hidden="true" />
                                Threshold: {flag.threshold_value}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              flag.severity === "high"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            )}
                          >
                            {flag.severity}
                          </Badge>
                        </div>
                        {flag.status === "acknowledged" && flag.acknowledgment_note && (
                          <p className="mt-2 text-xs text-blue-700 bg-blue-50 rounded p-2">
                            <Eye className="h-3 w-3 inline mr-1" aria-hidden="true" />
                            {flag.acknowledgment_note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
