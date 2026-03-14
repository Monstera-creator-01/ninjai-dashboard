"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useOperatorDashboard } from "@/hooks/use-operator-dashboard";
import { WorkspaceFilter } from "@/components/workspace-filter";
import { OperatorInlineFlags } from "@/components/operator-inline-flags";
import { OperatorDailyActivity } from "@/components/operator-daily-activity";
import { OperatorTimelineChart } from "@/components/operator-timeline-chart";
import { OperatorSenderTable } from "@/components/operator-sender-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Activity,
  AlertTriangle as AlertTriangleIcon,
  CalendarIcon,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Quick-action shortcuts */
function QuickActions() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
        <Link href="/dashboard/import">
          <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Upload New Data
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
        <Link href="/dashboard/health">
          <Activity className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Weekly Review
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
        <Link href="/dashboard/interventions">
          <AlertTriangleIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Manage Flags
        </Link>
      </Button>
    </div>
  );
}

/** Data freshness warning banner */
function DataFreshnessBanner({ dataFreshness }: { dataFreshness: string | null }) {
  if (!dataFreshness) return null;

  const uploadDate = new Date(dataFreshness);
  const now = new Date();
  const diffMs = now.getTime() - uploadDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Don't show warning if data is fresh (< 2 days)
  if (diffDays < 2) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
      <Clock className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
      <span className="text-sm text-amber-800">
        Data is {diffDays} day{diffDays !== 1 ? "s" : ""} old — last upload on{" "}
        {uploadDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
      <Button variant="ghost" size="sm" asChild className="ml-auto text-amber-700 hover:text-amber-900">
        <Link href="/dashboard/import">
          <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Upload
        </Link>
      </Button>
    </div>
  );
}

/** Date picker using shadcn Calendar + Popover */
function OperatorDatePicker({
  selectedDate,
  availableDates,
  onDateChange,
}: {
  selectedDate: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
}) {
  const availableDateSet = useMemo(
    () => new Set(availableDates),
    [availableDates]
  );

  const selected = selectedDate ? parseISO(selectedDate) : undefined;

  const formattedSelected = selected
    ? format(selected, "MMM d, yyyy")
    : "Select date";

  // Disable dates that have no data
  const disabledMatcher = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return !availableDateSet.has(dateStr);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
          aria-label="Select date"
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {formattedSelected}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              const dateStr = format(date, "yyyy-MM-dd");
              onDateChange(dateStr);
            }
          }}
          disabled={disabledMatcher}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Loading skeleton for the entire dashboard */
function OperatorLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading operator dashboard">
      {/* Quick actions */}
      <div className="flex gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>

      {/* Inline flags */}
      <Skeleton className="h-16 w-full" />

      {/* Activity cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timeline chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>

      {/* Sender table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>

      <span className="sr-only">Loading operator dashboard data...</span>
    </div>
  );
}

/** Error state */
function OperatorErrorState({
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
            <AlertTriangleIcon
              className="h-6 w-6 text-destructive"
              aria-hidden="true"
            />
          </div>
          <CardTitle>Failed to Load Dashboard</CardTitle>
          <CardDescription>{message}</CardDescription>
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

/** Empty state - no data at all */
function OperatorEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3
              className="h-6 w-6 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <CardTitle>No Campaign Data Yet</CardTitle>
          <CardDescription>
            Upload your Heyreach CSV exports to see the operator dashboard with
            daily metrics, sender activity, and campaign timelines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/import">
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Import CSV Data
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** Main Operator Dashboard component */
export function OperatorDashboard() {
  const {
    data,
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    selectedWorkspace,
    setSelectedWorkspace,
    refetch,
  } = useOperatorDashboard();

  // Loading state
  if (isLoading) {
    return <OperatorLoadingSkeleton />;
  }

  // Error state
  if (error) {
    return <OperatorErrorState message={error} onRetry={refetch} />;
  }

  // Empty state
  if (!data || data.availableDates.length === 0) {
    return <OperatorEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Quick-Action Shortcuts (AC-6) */}
      <QuickActions />

      {/* Data Freshness Warning (EC-4) */}
      <DataFreshnessBanner dataFreshness={data.dataFreshness} />

      {/* Toolbar: Workspace Filter (AC-7) + Date Picker (AC-5) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WorkspaceFilter
          workspaces={data.workspaces}
          value={selectedWorkspace}
          onChange={setSelectedWorkspace}
        />
        <OperatorDatePicker
          selectedDate={selectedDate}
          availableDates={data.availableDates}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Inline Intervention Flags (AC-3) */}
      <OperatorInlineFlags />

      {/* Daily Activity Overview (AC-1) */}
      <OperatorDailyActivity
        activity={data.dailyActivity}
        selectedDate={selectedDate}
      />

      {/* Campaign Activity Timeline (AC-4) */}
      <OperatorTimelineChart
        timeline={data.timeline}
        workspaces={data.workspaces}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
      />

      {/* Sender Activity Table (AC-2) */}
      <OperatorSenderTable senders={data.senderBreakdown} />
    </div>
  );
}
