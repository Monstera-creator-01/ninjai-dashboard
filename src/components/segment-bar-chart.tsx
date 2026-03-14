"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEGMENT_METRICS } from "@/lib/types/segments";
import type { SegmentData, SegmentMetric } from "@/lib/types/segments";

interface SegmentBarChartProps {
  segments: SegmentData[];
  totalSegments: number;
  metric: SegmentMetric;
  onMetricChange: (metric: SegmentMetric) => void;
}

const BAR_COLORS = [
  "hsl(221, 83%, 53%)",  // blue-600
  "hsl(262, 83%, 58%)",  // violet-500
  "hsl(142, 71%, 45%)",  // green-500
  "hsl(25, 95%, 53%)",   // orange-500
  "hsl(346, 77%, 50%)",  // rose-500
  "hsl(199, 89%, 48%)",  // sky-500
  "hsl(47, 96%, 53%)",   // yellow-400
  "hsl(173, 58%, 39%)",  // teal-500
  "hsl(292, 84%, 61%)",  // fuchsia-400
  "hsl(15, 75%, 55%)",   // burnt orange
  "hsl(250, 56%, 60%)",  // indigo-ish
  "hsl(160, 60%, 45%)",  // emerald
  "hsl(340, 65%, 55%)",  // pink
  "hsl(210, 50%, 50%)",  // steel blue
  "hsl(30, 80%, 50%)",   // amber
];

function getMetricLabel(metric: SegmentMetric): string {
  return SEGMENT_METRICS.find((m) => m.value === metric)?.label ?? metric;
}

function getMetricValue(segment: SegmentData, metric: SegmentMetric): number {
  switch (metric) {
    case "replyRate":
      return segment.replyRate;
    case "conversationCount":
      return segment.conversationCount;
    case "avgDepth":
      return segment.avgDepth;
    default:
      return 0;
  }
}

function formatMetricValue(value: number, metric: SegmentMetric): string {
  switch (metric) {
    case "replyRate":
      return `${value}%`;
    case "conversationCount":
      return String(value);
    case "avgDepth":
      return value.toFixed(1);
    default:
      return String(value);
  }
}

export function SegmentBarChart({
  segments,
  totalSegments,
  metric,
  onMetricChange,
}: SegmentBarChartProps) {
  // Take top 15 segments sorted by the selected metric (highest first)
  const chartData = [...segments]
    .sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric))
    .slice(0, 15)
    .map((seg) => ({
      name: seg.segmentValue.length > 20
        ? seg.segmentValue.slice(0, 18) + "..."
        : seg.segmentValue,
      fullName: seg.segmentValue,
      value: getMetricValue(seg, metric),
    }));

  const hiddenCount = totalSegments > 15 ? totalSegments - 15 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Segment-Vergleich</CardTitle>
            <CardDescription>
              {getMetricLabel(metric)} nach Segmenten
            </CardDescription>
          </div>
          <Select
            value={metric}
            onValueChange={(v) => onMetricChange(v as SegmentMetric)}
          >
            <SelectTrigger
              className="w-[180px]"
              aria-label="Metrik auswählen"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGMENT_METRICS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Keine Daten vorhanden
          </p>
        ) : (
          <>
            <div className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    domain={metric === "replyRate" ? [0, 100] : undefined}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatMetricValue(Number(value), metric),
                      getMetricLabel(metric),
                    ]}
                    labelFormatter={(label) => {
                      const item = chartData.find((d) => d.name === label);
                      return item?.fullName ?? String(label);
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {hiddenCount > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {hiddenCount} weitere Segmente nicht angezeigt
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
