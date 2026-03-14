"use client";

import { useMessagingInsights } from "@/hooks/use-messaging-insights";
import { MessagingWeeklyCard } from "@/components/messaging-weekly-card";
import { ReplyAnalysisOverview } from "@/components/reply-analysis-overview";
import { ConversationFilterBar } from "@/components/conversation-filter-bar";
import { ConversationTable } from "@/components/conversation-table";
import { MessagingEmptyState } from "@/components/messaging-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

function MessagingLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading messaging insights">
      {/* Weekly card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-16" />
            </div>
            <Skeleton className="h-[140px]" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px]" />
          </CardContent>
        </Card>
      </div>

      {/* Filter + table skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-2/3" />
      </div>
      <Skeleton className="h-[400px] w-full" />

      <span className="sr-only">Loading messaging insights...</span>
    </div>
  );
}

function MessagingErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold">Failed to Load Insights</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function MessagingInsight() {
  const {
    conversations,
    conversationsLoading,
    conversationsError,
    summary,
    summaryLoading,
    summaryError,
    filters,
    setFilters,
    resetFilters,
    updateTag,
    refetch,
  } = useMessagingInsights();

  // Loading state (initial load)
  if (summaryLoading && !summary) {
    return <MessagingLoadingSkeleton />;
  }

  // Error state
  if (summaryError && !summary) {
    return <MessagingErrorState message={summaryError} onRetry={refetch} />;
  }

  // Empty state (no conversations at all)
  if (
    summary &&
    summary.replyAnalysis.totalConversations === 0 &&
    !filters.search &&
    filters.workspace.length === 0
  ) {
    return <MessagingEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Weekly Insight Card (AC-5) */}
      {summary && <MessagingWeeklyCard data={summary.weeklySummary} />}

      {/* Reply Analysis Overview (AC-2) */}
      {summary && <ReplyAnalysisOverview data={summary.replyAnalysis} />}

      {/* Filter Bar (AC-1, AC-6) */}
      <ConversationFilterBar
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        workspaces={summary?.workspaces ?? []}
        senders={summary?.senders ?? []}
      />

      {/* Conversation Table (AC-1, AC-3, AC-4) */}
      {conversationsLoading && !conversations ? (
        <Skeleton className="h-[400px] w-full" />
      ) : conversationsError ? (
        <MessagingErrorState message={conversationsError} onRetry={refetch} />
      ) : conversations ? (
        <ConversationTable
          data={conversations}
          onPageChange={(page) => setFilters({ page })}
          onTagUpdate={updateTag}
        />
      ) : null}
    </div>
  );
}
