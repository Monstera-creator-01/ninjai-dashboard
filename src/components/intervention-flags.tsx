"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlagSummaryBar } from "@/components/flag-summary-bar";
import { FlagFilterBar } from "@/components/flag-filter-bar";
import { FlagList } from "@/components/flag-list";
import { FlagHistoryTable } from "@/components/flag-history-table";
import { FlagEmptyState } from "@/components/flag-empty-state";
import { FlagLoadingSkeleton } from "@/components/flag-loading-skeleton";
import { FlagErrorState } from "@/components/flag-error-state";
import { AcknowledgeFlagDialog } from "@/components/acknowledge-flag-dialog";
import { useFlags, useFlagActions } from "@/hooks/use-flags";
import { useFlagThresholds } from "@/hooks/use-flag-thresholds";
import { useToast } from "@/hooks/use-toast";
import type { Flag, FlagFilters } from "@/lib/types/flags";

export function InterventionFlags() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [filters, setFilters] = useState<FlagFilters>({
    status: "all",
    severity: "all",
    workspace: "all",
  });
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Dialog state
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);

  const { toast } = useToast();

  // Fetch active flags
  const {
    data: activeData,
    isLoading: isActiveLoading,
    error: activeError,
    refetch: refetchActive,
  } = useFlags(filters, "active", activePage);

  // Fetch history flags
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useFlags(filters, "history", historyPage);

  // Flag actions
  const { acknowledgeFlag, dismissFlag, isSubmitting } = useFlagActions();

  // Threshold data (to detect "all disabled" state)
  const { thresholds } = useFlagThresholds();
  const allFlagsDisabled =
    thresholds.length > 0 && thresholds.every((t) => !t.enabled);

  // Reset to page 1 when filters change
  const handleFiltersChange = useCallback((newFilters: FlagFilters) => {
    setFilters(newFilters);
    setActivePage(1);
    setHistoryPage(1);
  }, []);

  // Acknowledge handler
  const handleAcknowledgeClick = useCallback((flag: Flag) => {
    setSelectedFlag(flag);
    setAcknowledgeDialogOpen(true);
  }, []);

  const handleAcknowledgeConfirm = useCallback(
    async (flagId: string, note: string) => {
      const result = await acknowledgeFlag(flagId, note);

      if (result.success) {
        toast({
          title: "Flag acknowledged",
          description: "The flag has been marked as acknowledged.",
        });
        setAcknowledgeDialogOpen(false);
        setSelectedFlag(null);
        refetchActive();
      } else {
        toast({
          title: "Failed to acknowledge flag",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    [acknowledgeFlag, toast, refetchActive]
  );

  // Dismiss handler
  const handleDismiss = useCallback(
    async (flagId: string) => {
      const result = await dismissFlag(flagId);

      if (result.success) {
        toast({
          title: "Flag dismissed",
          description: "The flag has been resolved and moved to history.",
        });
        refetchActive();
        refetchHistory();
      } else {
        toast({
          title: "Failed to dismiss flag",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    [dismissFlag, toast, refetchActive, refetchHistory]
  );

  // Loading state
  if (isActiveLoading && activeTab === "active") {
    return <FlagLoadingSkeleton />;
  }

  // Error state
  if (activeError && activeTab === "active") {
    return <FlagErrorState message={activeError} onRetry={refetchActive} />;
  }

  const workspaces = activeData?.workspaces ?? historyData?.workspaces ?? [];
  const hasData = activeData?.hasData ?? historyData?.hasData ?? false;
  const summary = activeData?.summary ?? {
    activeHighCount: 0,
    activeMediumCount: 0,
    acknowledgedCount: 0,
    totalActiveCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <FlagSummaryBar summary={summary} />

      {/* Tabs: Active / History */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "active" | "history")}
      >
        <TabsList>
          <TabsTrigger value="active">
            Active Flags
            {summary.totalActiveCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                {summary.totalActiveCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Filters */}
          <FlagFilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            workspaces={workspaces}
            showStatusFilter={true}
          />

          {/* Flag list or empty state */}
          {activeData && activeData.flags.length > 0 ? (
            <FlagList
              flags={activeData.flags}
              totalCount={activeData.totalCount}
              page={activeData.page}
              pageSize={activeData.pageSize}
              onPageChange={setActivePage}
              onAcknowledge={handleAcknowledgeClick}
              onDismiss={handleDismiss}
              isSubmitting={isSubmitting}
            />
          ) : (
            <FlagEmptyState hasData={hasData} allDisabled={allFlagsDisabled} />
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Filters for history (no status filter) */}
          <FlagFilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            workspaces={workspaces}
            showStatusFilter={false}
          />

          {isHistoryLoading ? (
            <FlagLoadingSkeleton />
          ) : historyError ? (
            <FlagErrorState message={historyError} onRetry={refetchHistory} />
          ) : historyData ? (
            <FlagHistoryTable
              flags={historyData.flags}
              totalCount={historyData.totalCount}
              page={historyData.page}
              pageSize={historyData.pageSize}
              onPageChange={setHistoryPage}
            />
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Acknowledge dialog */}
      <AcknowledgeFlagDialog
        flag={selectedFlag}
        open={acknowledgeDialogOpen}
        onOpenChange={setAcknowledgeDialogOpen}
        onConfirm={handleAcknowledgeConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
