"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendArrow } from "@/components/trend-arrow";
import { cn } from "@/lib/utils";
import type { AMKPIData, AMMetric, WeekAssessment } from "@/lib/types/am-summary";

interface AMKPISectionProps {
  kpis: AMKPIData;
}

interface KPICardProps {
  label: string;
  metric: AMMetric;
  format: "number" | "percent";
}

const assessmentConfig: Record<
  WeekAssessment,
  { label: string; className: string }
> = {
  improved: {
    label: "Improved",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  stable: {
    label: "Stable",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  declining: {
    label: "Declining",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

function formatChange(metric: AMMetric, format: "number" | "percent"): string {
  if (metric.changePercent === null || metric.previous === null) return "";
  const sign = metric.changePercent > 0 ? "+" : "";
  if (format === "percent") {
    const diff = metric.current - metric.previous;
    const diffSign = diff > 0 ? "+" : "";
    return `${diffSign}${diff.toFixed(1)}pp`;
  }
  return `${sign}${metric.changePercent.toFixed(0)}%`;
}

function KPICard({ label, metric, format }: KPICardProps) {
  const displayValue =
    format === "percent"
      ? `${metric.current.toFixed(1)}%`
      : metric.current.toLocaleString();

  const previousValue =
    metric.previous !== null
      ? format === "percent"
        ? `${metric.previous.toFixed(1)}%`
        : metric.previous.toLocaleString()
      : null;

  const changeText = formatChange(metric, format);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <TrendArrow direction={metric.trend} />
        </div>
        <div className="text-2xl font-bold tabular-nums">{displayValue}</div>
        <div className="flex items-center gap-2 mt-1">
          {previousValue !== null && (
            <span className="text-xs text-muted-foreground">
              prev: {previousValue}
            </span>
          )}
          {changeText && (
            <span
              className={cn("text-xs font-medium", {
                "text-emerald-600": metric.trend === "up",
                "text-red-600": metric.trend === "down",
                "text-gray-500": metric.trend === "stable" || metric.trend === null,
              })}
            >
              ({changeText})
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AMKPISection({ kpis }: AMKPISectionProps) {
  const assessment = assessmentConfig[kpis.weekAssessment];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">KPIs & Trends</h3>
        <Badge
          variant="outline"
          className={cn(assessment.className)}
          aria-label={`Week assessment: ${assessment.label}`}
        >
          {assessment.label}
        </Badge>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KPICard
          label="Connections Sent"
          metric={kpis.connectionsSent}
          format="number"
        />
        <KPICard
          label="Acceptance Rate"
          metric={kpis.acceptanceRate}
          format="percent"
        />
        <KPICard
          label="Messages Started"
          metric={kpis.messagesStarted}
          format="number"
        />
        <KPICard
          label="Reply Rate"
          metric={kpis.replyRate}
          format="percent"
        />
        <KPICard
          label="Replies Received"
          metric={kpis.repliesReceived}
          format="number"
        />
      </div>
    </div>
  );
}
