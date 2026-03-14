"use client";

import { useState } from "react";
import { useSegmentComparison } from "@/hooks/use-segment-comparison";
import { SegmentFilterBar } from "@/components/segment-filter-bar";
import { SegmentBarChart } from "@/components/segment-bar-chart";
import { SegmentComparisonTable } from "@/components/segment-comparison-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, Upload, Info } from "lucide-react";
import Link from "next/link";
import type { SegmentMetric } from "@/lib/types/segments";

function SegmentLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Lade Segment-Vergleich">
      {/* Filter bar skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-[180px]" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>

      {/* Chart skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>

      <span className="sr-only">Lade Segment-Vergleich...</span>
    </div>
  );
}

function SegmentErrorState({
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
            <AlertTriangle
              className="h-6 w-6 text-destructive"
              aria-hidden="true"
            />
          </div>
          <h3 className="text-lg font-semibold">
            Fehler beim Laden der Segment-Daten
          </h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SegmentEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold">
            Noch keine Conversations vorhanden
          </h3>
          <p className="text-sm text-muted-foreground">
            Importiere Daten über CSV Upload.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/import">Zum CSV Import</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SegmentNoResultsState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <h3 className="text-lg font-semibold">
            Keine Conversations im gewählten Zeitraum
          </h3>
          <p className="text-sm text-muted-foreground">
            Versuche einen anderen Zeitraum oder setze die Filter zurück.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onReset}>
            Filter zurücksetzen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function SegmentComparison() {
  const {
    data,
    loading,
    error,
    filters,
    setDimension,
    setDatePreset,
    setCustomDateRange,
    resetFilters,
    refetch,
  } = useSegmentComparison();

  const [metric, setMetric] = useState<SegmentMetric>("replyRate");

  // Loading state (initial load)
  if (loading && !data) {
    return <SegmentLoadingSkeleton />;
  }

  // Error state
  if (error && !data) {
    return <SegmentErrorState message={error} onRetry={refetch} />;
  }

  // Empty state (no conversations at all in database)
  if (data && data.segments.length === 0 && !data.hasAnyConversations) {
    return (
      <>
        <SegmentFilterBar
          filters={filters}
          onDimensionChange={setDimension}
          onDatePresetChange={setDatePreset}
          onCustomDateChange={setCustomDateRange}
        />
        <SegmentEmptyState />
      </>
    );
  }

  // No results for current filter
  if (data && data.segments.length === 0) {
    return (
      <>
        <SegmentFilterBar
          filters={filters}
          onDimensionChange={setDimension}
          onDatePresetChange={setDatePreset}
          onCustomDateChange={setCustomDateRange}
        />
        <SegmentNoResultsState onReset={resetFilters} />
      </>
    );
  }

  // Single segment info
  const showSingleSegmentInfo = data && data.segments.length === 1;

  return (
    <div className="space-y-6">
      {/* Filter Bar (AC-1, AC-2) */}
      <SegmentFilterBar
        filters={filters}
        onDimensionChange={setDimension}
        onDatePresetChange={setDatePreset}
        onCustomDateChange={setCustomDateRange}
      />

      {/* Single segment info (AC-6) */}
      {showSingleSegmentInfo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nur 1 Segment vorhanden — importiere weitere Daten für einen
            Vergleich.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading overlay for subsequent loads */}
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        {/* Comparison Bar Chart (AC-3) */}
        {data && (
          <SegmentBarChart
            segments={data.segments}
            totalSegments={data.totalSegments}
            metric={metric}
            onMetricChange={setMetric}
          />
        )}

        {/* Comparison Table (AC-4, AC-5) */}
        {data && (
          <div className="mt-6">
            <SegmentComparisonTable
              segments={data.segments}
              dimension={data.dimension}
            />
          </div>
        )}
      </div>
    </div>
  );
}
