"use client";

import { useWeeklyReview } from "@/hooks/use-weekly-review";
import { WeekSelector } from "@/components/week-selector";
import { WeeklySummaryBar } from "@/components/weekly-summary-bar";
import { WowComparisonTable } from "@/components/wow-comparison-table";
import { WorkspaceWeeklyCard } from "@/components/workspace-weekly-card";
import { WeeklyReviewLoading } from "@/components/weekly-review-loading";
import { WeeklyReviewEmpty } from "@/components/weekly-review-empty";
import { WeeklyReviewError } from "@/components/weekly-review-error";

export function WeeklyReview() {
  const { data, isLoading, error, selectedWeek, setSelectedWeek, refetch } =
    useWeeklyReview();

  // Loading state
  if (isLoading) {
    return <WeeklyReviewLoading />;
  }

  // Error state
  if (error) {
    return <WeeklyReviewError message={error} onRetry={refetch} />;
  }

  // Empty state (no data uploaded at all)
  if (!data || data.availableWeeks.length === 0) {
    return <WeeklyReviewEmpty />;
  }

  // Selected week has no workspace data
  const hasWorkspaceData = data.workspaces.length > 0;

  return (
    <div className="space-y-6">
      {/* Week selector */}
      <WeekSelector
        availableWeeks={data.availableWeeks}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
      />

      {!hasWorkspaceData ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No data available for the selected week.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try selecting a different week from the dropdown above.
          </p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <WeeklySummaryBar summary={data.summary} />

          {/* Week-over-week comparison table */}
          <WowComparisonTable workspaces={data.workspaces} />

          {/* Per-workspace expandable cards */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Workspace Details
            </h3>
            <div className="space-y-4">
              {data.workspaces.map((ws) => (
                <WorkspaceWeeklyCard key={ws.workspace} workspace={ws} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
