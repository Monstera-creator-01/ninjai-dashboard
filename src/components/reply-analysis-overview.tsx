"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReplyAnalysisSummary } from "@/lib/types/messaging";

interface ReplyAnalysisOverviewProps {
  data: ReplyAnalysisSummary;
}

export function ReplyAnalysisOverview({ data }: ReplyAnalysisOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Stats Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversation Overview</CardTitle>
          <CardDescription>Reply analysis across all conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{data.totalConversations}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reply Rate</p>
              <p className="text-2xl font-bold">{data.replyPercentage}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">With Replies</p>
              <p className="text-lg font-semibold text-green-600">{data.withReplies}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Without Replies</p>
              <p className="text-lg font-semibold text-muted-foreground">{data.withoutReplies}</p>
            </div>
          </div>

          {/* Top Senders */}
          {data.topSenders.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Top Senders by Reply Rate
              </p>
              <div className="space-y-2">
                {data.topSenders.map((sender) => (
                  <div
                    key={`${sender.workspace}-${sender.senderName}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{sender.senderName}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {sender.workspace}
                      </Badge>
                    </div>
                    <span className="shrink-0 ml-2 font-semibold">
                      {sender.replyRate}%
                      <span className="text-muted-foreground font-normal ml-1">
                        ({sender.replyCount}/{sender.totalConversations})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Depth Distribution Bar Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversation Depth</CardTitle>
          <CardDescription>Distribution by touch count</CardDescription>
        </CardHeader>
        <CardContent>
          {data.depthDistribution.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.depthDistribution}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value) => [String(value), "Conversations"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              No depth data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
