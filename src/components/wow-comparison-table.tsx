"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthBadge } from "@/components/health-badge";
import { cn } from "@/lib/utils";
import type { WorkspaceWeeklySummary, WowChange } from "@/lib/types/weekly-review";

interface WowComparisonTableProps {
  workspaces: WorkspaceWeeklySummary[];
}

function formatChange(change: WowChange): {
  text: string;
  className: string;
} {
  if (change.changePercent === null) {
    return { text: "--", className: "text-muted-foreground" };
  }

  const sign = change.changePercent > 0 ? "+" : "";
  const text = `${sign}${change.changePercent.toFixed(1)}%`;

  let className = "text-muted-foreground";
  if (change.direction === "up") className = "text-emerald-600 font-medium";
  if (change.direction === "down") className = "text-red-600 font-medium";

  return { text, className };
}

function formatMetric(value: number, isPercent = false): string {
  if (isPercent) return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

export function WowComparisonTable({ workspaces }: WowComparisonTableProps) {
  if (workspaces.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Week-over-Week Comparison</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Workspace</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="text-right min-w-[100px]">
                Conn. Sent
              </TableHead>
              <TableHead className="text-right min-w-[80px]">
                Change
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                Accept. Rate
              </TableHead>
              <TableHead className="text-right min-w-[80px]">
                Change
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                Msg. Started
              </TableHead>
              <TableHead className="text-right min-w-[80px]">
                Change
              </TableHead>
              <TableHead className="text-right min-w-[90px]">
                Reply Rate
              </TableHead>
              <TableHead className="text-right min-w-[80px]">
                Change
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces.map((ws) => {
              const connChange = formatChange(ws.wow.connectionsSent);
              const accChange = formatChange(ws.wow.acceptanceRate);
              const msgChange = formatChange(ws.wow.messagesStarted);
              const replyChange = formatChange(ws.wow.replyRate);

              return (
                <TableRow key={ws.workspace}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span>{ws.workspace}</span>
                      {ws.isPartialWeek && (
                        <span className="text-xs text-muted-foreground">
                          {ws.daysWithData} of 7 days
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <HealthBadge status={ws.healthStatus} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMetric(ws.metrics.connectionsSent)}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", connChange.className)}>
                    {connChange.text}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMetric(ws.metrics.acceptanceRate, true)}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", accChange.className)}>
                    {accChange.text}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMetric(ws.metrics.messagesStarted)}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", msgChange.className)}>
                    {msgChange.text}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMetric(ws.metrics.replyRate, true)}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", replyChange.className)}>
                    {replyChange.text}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
