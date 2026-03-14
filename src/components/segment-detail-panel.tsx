"use client";

import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { SegmentData, SegmentDimension } from "@/lib/types/segments";

interface SegmentDetailPanelProps {
  segment: SegmentData;
  dimension: SegmentDimension;
}

function buildMessagingLink(
  dimension: SegmentDimension,
  segmentValue: string
): string {
  const params = new URLSearchParams();

  switch (dimension) {
    case "workspace":
      params.set("workspace", segmentValue);
      break;
    case "sender":
      params.set("sender", segmentValue);
      break;
    case "position":
      // Position isn't a direct filter in messaging, but we can use search
      if (segmentValue !== "Keine Angabe") {
        params.set("search", segmentValue);
      }
      break;
    case "category":
      // Map display labels back to category values
      if (segmentValue === "Untagged") {
        params.set("category", "untagged");
      } else {
        // Try to match by searching lowercase
        const categoryMap: Record<string, string> = {
          "Interested / Positive": "interested",
          "Objection / Pushback": "objection",
          "Not now / Timing": "not_now",
          "Wrong person / Left company": "wrong_person",
          "Not interested / Rejection": "not_interested",
          "Referral / Redirect": "referral",
        };
        const catValue = categoryMap[segmentValue];
        if (catValue) {
          params.set("category", catValue);
        }
      }
      break;
  }

  const qs = params.toString();
  return `/dashboard/messaging${qs ? `?${qs}` : ""}`;
}

export function SegmentDetailPanel({
  segment,
  dimension,
}: SegmentDetailPanelProps) {
  const pieData = segment.categoryBreakdown.filter(
    (item) => item.category !== "untagged"
  );

  const showSenders = dimension !== "sender" && segment.topSenders.length > 0;

  return (
    <div className="grid gap-6 p-4 md:grid-cols-3 bg-muted/30 border-t">
      {/* Reply Category Pie Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Reply-Kategorien</h4>
        {pieData.length > 0 ? (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} Conversations`,
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-4">
            Keine getaggten Conversations
          </p>
        )}
        {/* Legend */}
        {pieData.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {pieData.map((item) => (
              <div
                key={item.category}
                className="flex items-center gap-1 text-[10px]"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Depth Distribution */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Conversation Depth</h4>
        <div className="space-y-2">
          {segment.depthDistribution.map((item) => {
            const percentage =
              segment.conversationCount > 0
                ? Math.round((item.count / segment.conversationCount) * 100)
                : 0;
            return (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.category}</span>
                  <span className="font-medium">
                    {item.count}{" "}
                    <span className="text-muted-foreground">({percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {segment.depthDistribution.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Keine Depth-Daten
            </p>
          )}
        </div>

        {/* Top 3 Senders */}
        {showSenders && (
          <div className="pt-3 border-t space-y-2">
            <h4 className="text-sm font-semibold">Top 3 Sender</h4>
            <div className="space-y-1.5">
              {segment.topSenders.map((sender, i) => (
                <div
                  key={sender.senderName}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-muted-foreground shrink-0">
                      {i + 1}.
                    </span>
                    <span className="truncate font-medium">
                      {sender.senderName}
                    </span>
                  </div>
                  <div className="shrink-0 ml-2">
                    <Badge variant="outline" className="text-[10px]">
                      {sender.replyRate}% Reply
                    </Badge>
                    <span className="text-muted-foreground ml-1">
                      ({sender.conversationCount})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Details</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conversations</span>
              <span className="font-medium">{segment.conversationCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reply Rate</span>
              <span className="font-medium">{segment.replyRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. Depth</span>
              <span className="font-medium">{segment.avgDepth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top Kategorie</span>
              <span className="font-medium">
                {segment.topCategory ?? "\u2014"}
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={buildMessagingLink(dimension, segment.segmentValue)}>
            <ExternalLink className="mr-2 h-3 w-3" aria-hidden="true" />
            Conversations anzeigen
          </Link>
        </Button>
      </div>
    </div>
  );
}
