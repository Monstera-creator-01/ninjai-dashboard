"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { FunnelStage } from "@/lib/types/weekly-review";

interface FunnelChartProps {
  stages: FunnelStage[];
}

const COLORS = [
  "hsl(221, 83%, 53%)", // Blue - Connections Sent
  "hsl(199, 89%, 48%)", // Light blue - Accepted
  "hsl(262, 83%, 58%)", // Purple - Messages Started
  "hsl(142, 71%, 45%)", // Green - Replies
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: FunnelStage;
    value: number;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const stage = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{stage.name}</p>
      <p className="text-sm text-muted-foreground">
        Count: <span className="font-semibold text-foreground">{stage.value.toLocaleString()}</span>
      </p>
      {stage.conversionRate !== null && (
        <p className="text-sm text-muted-foreground">
          Conversion to next:{" "}
          <span className="font-semibold text-foreground">
            {stage.conversionRate}%
          </span>
        </p>
      )}
    </div>
  );
}

export function FunnelChart({ stages }: FunnelChartProps) {
  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        No funnel data available
      </div>
    );
  }

  // Find the biggest drop-off
  let biggestDropIdx = -1;
  let biggestDropPct = 0;
  for (let i = 0; i < stages.length - 1; i++) {
    if (stages[i].value > 0) {
      const dropPct =
        ((stages[i].value - stages[i + 1].value) / stages[i].value) * 100;
      if (dropPct > biggestDropPct) {
        biggestDropPct = dropPct;
        biggestDropIdx = i;
      }
    }
  }

  // Build chart data with conversion labels
  const chartData = stages.map((stage, idx) => ({
    ...stage,
    label:
      stage.conversionRate !== null
        ? `${stage.value.toLocaleString()} (${stage.conversionRate}%)`
        : stage.value.toLocaleString(),
    isBiggestDrop: idx === biggestDropIdx,
  }));

  return (
    <div className="space-y-2">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={36}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[idx % COLORS.length]}
                  opacity={entry.isBiggestDrop ? 1 : 0.8}
                />
              ))}
              <LabelList
                dataKey="label"
                position="right"
                className="fill-foreground text-xs"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {biggestDropIdx >= 0 && (
        <p className="text-xs text-amber-600 font-medium">
          Biggest drop-off: {stages[biggestDropIdx].name} to{" "}
          {stages[biggestDropIdx + 1].name} ({biggestDropPct.toFixed(1)}% loss)
        </p>
      )}
    </div>
  );
}
