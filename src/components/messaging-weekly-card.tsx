"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MessageSquare, Tag, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeeklySummary } from "@/lib/types/messaging";

interface MessagingWeeklyCardProps {
  data: WeeklySummary;
}

export function MessagingWeeklyCard({ data }: MessagingWeeklyCardProps) {
  const hasTaggedData = data.categoryBreakdown.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Weekly Insight Summary
        </CardTitle>
        <CardDescription>Last 7 days conversation activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* New Replies + Untagged */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">New Replies</p>
              <p className="text-3xl font-bold">{data.newReplies}</p>
            </div>
            {data.untaggedCount > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <Tag className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span className="text-xs text-amber-800">
                  {data.untaggedCount} untagged conversation{data.untaggedCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-2">Reply Categories</p>
            {hasTaggedData ? (
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                    >
                      {data.categoryBreakdown.map((entry) => (
                        <Cell key={entry.category} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [String(value), ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-4">
                No tagged conversations yet
              </p>
            )}
            {/* Legend */}
            {hasTaggedData && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {data.categoryBreakdown.map((entry) => (
                  <div key={entry.category} className="flex items-center gap-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {entry.label} ({entry.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notable Conversations */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Notable Conversations</p>
            {data.notableConversations.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {data.notableConversations.slice(0, 5).map((c) => (
                  <div
                    key={c.conversation_id}
                    className="flex items-start gap-2 text-xs"
                  >
                    {c.is_notable && (
                      <Star className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {[c.lead_first_name, c.lead_last_name].filter(Boolean).join(" ") || "Unknown"}
                      </p>
                      <p className="text-muted-foreground truncate">
                        {c.lead_company || c.workspace}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 ml-auto">
                      {c.conversation_depth_category}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No notable conversations
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
