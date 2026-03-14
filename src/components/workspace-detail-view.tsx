"use client";

import Link from "next/link";
import { useWorkspaceDetail } from "@/hooks/use-workspace-detail";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthBadge } from "@/components/health-badge";
import { ActivityIndicator } from "@/components/activity-indicator";
import { TrendArrow } from "@/components/trend-arrow";
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";

interface WorkspaceDetailViewProps {
  workspace: string;
}

function formatFreshness(isoDate: string | null): string {
  if (!isoDate) return "No data uploaded";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Updated just now";
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  if (diffDays === 1) return "Updated 1 day ago";
  return `Updated ${diffDays} days ago`;
}

function DetailLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading workspace details">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <span className="sr-only">Loading workspace detail data...</span>
    </div>
  );
}

export function WorkspaceDetailView({ workspace }: WorkspaceDetailViewProps) {
  const { data, isLoading, error, refetch } = useWorkspaceDetail(workspace);

  if (isLoading) {
    return <DetailLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle>Failed to Load Data</CardTitle>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Snapshot
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Header with name and health badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">
            {data.workspace}
          </h2>
          <HealthBadge status={data.healthStatus} />
        </div>
        <ActivityIndicator
          level={data.activityLevel}
          lastActiveDate={summary.lastActiveDate}
        />
      </div>

      {/* Data freshness */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" aria-hidden="true" />
        <span>{formatFreshness(data.dataFreshness)}</span>
      </div>

      {/* Summary metrics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connections Sent (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {summary.connectionsSent7d.current.toLocaleString()}
              </span>
              <TrendArrow direction={summary.connectionsSent7d.trend} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.connectionsSentLifetime.toLocaleString()} lifetime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acceptance Rate (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {summary.acceptanceRate7d.current.toFixed(1)}%
              </span>
              <TrendArrow direction={summary.acceptanceRate7d.trend} />
            </div>
            {summary.acceptanceRate7d.previous !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                vs {summary.acceptanceRate7d.previous.toFixed(1)}% prev week
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages Started (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {summary.messagesStarted7d.current.toLocaleString()}
              </span>
              <TrendArrow direction={summary.messagesStarted7d.trend} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reply Rate (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {summary.replyRate7d.current.toFixed(1)}%
              </span>
              <TrendArrow direction={summary.replyRate7d.trend} />
            </div>
            {summary.replyRate7d.previous !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                vs {summary.replyRate7d.previous.toFixed(1)}% prev week
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Replies Received (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {summary.repliesReceived7d.current.toLocaleString()}
              </span>
              <TrendArrow direction={summary.repliesReceived7d.trend} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Breakdown (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No daily data available for this workspace.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Conn. Sent</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Conn. Accepted</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Accept. Rate</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Msgs Started</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Replies</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Reply Rate</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Profile Views</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Follows</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dailyData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {new Date(row.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.connectionsSent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.connectionsAccepted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.acceptanceRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.messagesStarted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.messageReplies.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.replyRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.profileViews.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.follows.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
