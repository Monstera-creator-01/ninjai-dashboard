"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendArrow } from "@/components/trend-arrow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  UserCheck,
  Percent,
  MessageSquare,
  Reply,
  BarChart3,
  Eye,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyActivity, DailyMetricComparison } from "@/lib/types/operator";

interface OperatorDailyActivityProps {
  activity: DailyActivity;
  selectedDate: string;
}

interface MetricCardConfig {
  key: keyof Omit<DailyActivity, "date">;
  icon: React.ComponentType<{ className?: string }>;
  format: (value: number) => string;
  /** Whether higher is better (true) or neutral (null for rates) */
  higherIsBetter: boolean;
}

const METRIC_CONFIGS: MetricCardConfig[] = [
  {
    key: "connectionsSent",
    icon: Send,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    key: "connectionsAccepted",
    icon: UserCheck,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    key: "acceptanceRate",
    icon: Percent,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    key: "messagesStarted",
    icon: MessageSquare,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    key: "repliesReceived",
    icon: Reply,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    key: "replyRate",
    icon: BarChart3,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    key: "profileViews",
    icon: Eye,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
  {
    key: "follows",
    icon: UserPlus,
    format: (v) => v.toLocaleString(),
    higherIsBetter: true,
  },
];

function formatChangePercent(
  changePercent: number | null,
  higherIsBetter: boolean
): { text: string; colorClass: string } {
  if (changePercent === null) {
    return { text: "--", colorClass: "text-muted-foreground" };
  }

  const sign = changePercent > 0 ? "+" : "";
  const text = `${sign}${changePercent.toFixed(1)}%`;

  if (Math.abs(changePercent) < 2) {
    return { text, colorClass: "text-muted-foreground" };
  }

  const isPositive = changePercent > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;

  return {
    text,
    colorClass: isGood ? "text-emerald-600" : "text-red-600",
  };
}

function MetricCard({
  metric,
  config,
}: {
  metric: DailyMetricComparison;
  config: MetricCardConfig;
}) {
  const Icon = config.icon;
  const change = formatChangePercent(
    metric.changePercent,
    config.higherIsBetter
  );
  const hasComparison = metric.previousValue !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {metric.label}
        </CardTitle>
        <Icon
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{config.format(metric.value)}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <TrendArrow direction={metric.trend} />
          {hasComparison ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn("text-xs font-medium", change.colorClass)}
                  >
                    {change.text} vs prev. week
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Previous: {config.format(metric.previousValue!)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground">
                    No comparison data
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not enough data for comparison</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function OperatorDailyActivity({
  activity,
  selectedDate,
}: OperatorDailyActivityProps) {
  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Daily Activity - {formattedDate}
        </h3>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {METRIC_CONFIGS.map((config) => {
          const metric = activity[config.key] as DailyMetricComparison;
          return (
            <MetricCard key={config.key} metric={metric} config={config} />
          );
        })}
      </div>
    </div>
  );
}
