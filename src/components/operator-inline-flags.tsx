"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/severity-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Calendar,
  TrendingDown,
  Target,
} from "lucide-react";
import type { Flag, FlagsResponse } from "@/lib/types/flags";
import { FLAG_TYPE_LABELS } from "@/lib/types/flags";

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export function OperatorInlineFlags() {
  const [highFlags, setHighFlags] = useState<Flag[]>([]);
  const [mediumCount, setMediumCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch high-severity active/acknowledged flags
      const highParams = new URLSearchParams({
        severity: "high",
        pageSize: "10",
      });
      const highResponse = await fetch(`/api/flags?${highParams.toString()}`);

      if (!highResponse.ok) {
        throw new Error("Failed to load flags");
      }

      const highData: FlagsResponse = await highResponse.json();
      // Filter to only active and acknowledged (not resolved)
      const activeHighFlags = highData.flags.filter(
        (f) => f.status === "active" || f.status === "acknowledged"
      );
      setHighFlags(activeHighFlags);

      // Use summary for medium count
      setMediumCount(highData.summary.activeMediumCount);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load flags";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading flags">
        <Skeleton className="h-20 w-full" />
        <span className="sr-only">Loading intervention flags...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-2 py-3">
          <AlertTriangle
            className="h-4 w-4 text-destructive"
            aria-hidden="true"
          />
          <span className="text-sm text-destructive">{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchFlags}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // All clear - no high-severity flags
  if (highFlags.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-5 w-5 text-emerald-600"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-emerald-800">
              All Clear - No high-severity flags
            </span>
            {mediumCount > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200"
              >
                {mediumCount} medium
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/interventions">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Manage Flags
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Has high-severity flags - show them
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="h-4 w-4 text-red-600"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-red-800">
            {highFlags.length} High-Severity Flag{highFlags.length !== 1 ? "s" : ""}
          </span>
          {mediumCount > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-200"
            >
              +{mediumCount} medium
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/interventions">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Manage All Flags
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {highFlags.map((flag) => (
          <Card
            key={flag.id}
            className="border-red-200 bg-red-50/30"
          >
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">{flag.workspace}</CardTitle>
                    <SeverityBadge severity={flag.severity} />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {FLAG_TYPE_LABELS[flag.flag_type]}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Calendar
                    className="h-3 w-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(flag.created_at)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <TrendingDown
                    className="h-3 w-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-semibold text-red-600">
                    {flag.triggered_value}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Target
                    className="h-3 w-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">Threshold:</span>
                  <span className="font-semibold">{flag.threshold_value}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
