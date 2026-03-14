"use client";

import { useState, useMemo } from "react";
import { useCampaignSnapshot } from "@/hooks/use-campaign-snapshot";
import { SnapshotSummaryBar } from "@/components/snapshot-summary-bar";
import { WorkspaceFilter } from "@/components/workspace-filter";
import { WorkspaceCard } from "@/components/workspace-card";
import { SnapshotEmptyState } from "@/components/snapshot-empty-state";
import { SnapshotLoadingSkeleton } from "@/components/snapshot-loading-skeleton";
import { SnapshotErrorState } from "@/components/snapshot-error-state";

export function CampaignSnapshot() {
  const [workspaceFilter, setWorkspaceFilter] = useState("all");
  const { data, isLoading, error, refetch } = useCampaignSnapshot();

  // Filter workspaces client-side (all data is already loaded)
  const filteredWorkspaces = useMemo(() => {
    if (!data) return [];
    if (workspaceFilter === "all") return data.workspaces;
    return data.workspaces.filter((ws) => ws.workspace === workspaceFilter);
  }, [data, workspaceFilter]);

  // Compute filtered summary
  const filteredSummary = useMemo(() => {
    if (!data) return null;
    if (workspaceFilter === "all") return data.summary;

    // Recompute summary for filtered workspaces
    const wsList = filteredWorkspaces;
    return {
      totalConnectionsSent7d: wsList.reduce(
        (sum, ws) => sum + ws.connectionsSent7d.current,
        0
      ),
      avgAcceptanceRate7d:
        wsList.length > 0
          ? Math.round(
              (wsList.reduce((sum, ws) => sum + ws.acceptanceRate7d.current, 0) /
                wsList.length) *
                100
            ) / 100
          : 0,
      totalMessagesStarted7d: wsList.reduce(
        (sum, ws) => sum + ws.messagesStarted7d.current,
        0
      ),
      avgReplyRate7d:
        wsList.length > 0
          ? Math.round(
              (wsList.reduce((sum, ws) => sum + ws.replyRate7d.current, 0) /
                wsList.length) *
                100
            ) / 100
          : 0,
      totalRepliesReceived7d: wsList.reduce(
        (sum, ws) => sum + ws.repliesReceived7d.current,
        0
      ),
      workspaceCount: wsList.length,
    };
  }, [data, workspaceFilter, filteredWorkspaces]);

  // Get all workspace names for the filter dropdown
  const allWorkspaceNames = useMemo(() => {
    if (!data) return [];
    return data.workspaces.map((ws) => ws.workspace).sort();
  }, [data]);

  // Loading state
  if (isLoading) {
    return <SnapshotLoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <SnapshotErrorState message={error} onRetry={refetch} />;
  }

  // Empty state (no data uploaded)
  if (!data || data.workspaces.length === 0) {
    return <SnapshotEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      {filteredSummary && (
        <SnapshotSummaryBar
          summary={filteredSummary}
          dataFreshness={data.dataFreshness}
        />
      )}

      {/* Workspace filter */}
      <WorkspaceFilter
        workspaces={allWorkspaceNames}
        value={workspaceFilter}
        onChange={setWorkspaceFilter}
      />

      {/* Workspace cards grid */}
      {filteredWorkspaces.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No workspaces match the selected filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.workspace} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  );
}
