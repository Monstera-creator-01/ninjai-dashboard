"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimelineDataPoint } from "@/lib/types/operator";

interface OperatorTimelineChartProps {
  timeline: TimelineDataPoint[];
  workspaces: string[];
  selectedWorkspace: string;
  onWorkspaceChange: (workspace: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !label) return null;

  const date = new Date(label + "T00:00:00");
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">
        {formattedDate}
        {isWeekend && (
          <span className="ml-1.5 text-xs text-muted-foreground">(Weekend)</span>
        )}
      </p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              {entry.name === "connectionsSent"
                ? "Connections Sent"
                : "Replies Received"}
              :
            </span>
            <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OperatorTimelineChart({
  timeline,
  workspaces,
  selectedWorkspace,
  onWorkspaceChange,
}: OperatorTimelineChartProps) {
  // Find weekend ranges for reference areas
  const weekendRanges = useMemo(() => {
    const ranges: { start: string; end: string }[] = [];
    let currentRange: { start: string; end: string } | null = null;

    for (const point of timeline) {
      if (point.isWeekend) {
        if (!currentRange) {
          currentRange = { start: point.date, end: point.date };
        } else {
          currentRange.end = point.date;
        }
      } else {
        if (currentRange) {
          ranges.push(currentRange);
          currentRange = null;
        }
      }
    }
    if (currentRange) {
      ranges.push(currentRange);
    }
    return ranges;
  }, [timeline]);

  // Format axis ticks
  const formatXAxisTick = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Activity Timeline</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No timeline data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Campaign Activity Timeline</CardTitle>
            <CardDescription>
              Last 30 days - Connections sent and replies received
            </CardDescription>
          </div>
          {workspaces.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-xs",
                  selectedWorkspace === "all"
                    ? "bg-muted font-medium"
                    : "text-muted-foreground"
                )}
                onClick={() => onWorkspaceChange("all")}
              >
                All Combined
              </Button>
              {workspaces.map((ws) => (
                <Button
                  key={ws}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 text-xs",
                    selectedWorkspace === ws
                      ? "bg-muted font-medium"
                      : "text-muted-foreground"
                  )}
                  onClick={() => onWorkspaceChange(ws)}
                >
                  {ws}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeline}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

              {/* Weekend shading */}
              {weekendRanges.map((range, idx) => (
                <ReferenceArea
                  key={`weekend-${idx}`}
                  x1={range.start}
                  x2={range.end}
                  fill="hsl(var(--muted))"
                  fillOpacity={0.3}
                  strokeOpacity={0}
                />
              ))}

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={formatXAxisTick}
                interval="preserveStartEnd"
                tickCount={7}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                width={45}
                tickFormatter={(v) => v.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="connectionsSent"
                name="connectionsSent"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="repliesReceived"
                name="repliesReceived"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "hsl(221, 83%, 53%)" }}
              aria-hidden="true"
            />
            Connections Sent
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "hsl(142, 71%, 45%)" }}
              aria-hidden="true"
            />
            Replies Received
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-6 rounded bg-muted/60"
              aria-hidden="true"
            />
            Weekends
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
