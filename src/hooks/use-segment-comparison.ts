"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, subDays } from "date-fns";
import type {
  SegmentDimension,
  DatePreset,
  SegmentFilters,
  SegmentComparisonResponse,
} from "@/lib/types/segments";

const DEFAULT_FILTERS: SegmentFilters = {
  dimension: "workspace",
  datePreset: "30d",
  dateFrom: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  dateTo: format(new Date(), "yyyy-MM-dd"),
};

function getDateRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dateTo = format(today, "yyyy-MM-dd");

  switch (preset) {
    case "7d":
      return { dateFrom: format(subDays(today, 7), "yyyy-MM-dd"), dateTo };
    case "30d":
      return { dateFrom: format(subDays(today, 30), "yyyy-MM-dd"), dateTo };
    case "90d":
      return { dateFrom: format(subDays(today, 90), "yyyy-MM-dd"), dateTo };
    case "all":
      return { dateFrom: "", dateTo: "" };
    case "custom":
      // Custom keeps whatever is set already
      return { dateFrom: "", dateTo: "" };
    default:
      return { dateFrom: format(subDays(today, 30), "yyyy-MM-dd"), dateTo };
  }
}

function buildQueryParams(filters: SegmentFilters): string {
  const params = new URLSearchParams();
  params.set("dimension", filters.dimension);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  return `?${params.toString()}`;
}

interface UseSegmentComparisonReturn {
  data: SegmentComparisonResponse | null;
  loading: boolean;
  error: string | null;
  filters: SegmentFilters;
  setDimension: (dimension: SegmentDimension) => void;
  setDatePreset: (preset: DatePreset) => void;
  setCustomDateRange: (dateFrom: string, dateTo: string) => void;
  resetFilters: () => void;
  refetch: () => void;
}

export function useSegmentComparison(): UseSegmentComparisonReturn {
  const [data, setData] = useState<SegmentComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SegmentFilters>(DEFAULT_FILTERS);

  // AbortController ref for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSegments = useCallback(async (f: SegmentFilters) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = `/api/campaigns/segments${buildQueryParams(f)}`;
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${response.status}`);
      }

      const json: SegmentComparisonResponse = await response.json();
      setData(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Request was cancelled, don't update state
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to load segment comparison"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSegments(DEFAULT_FILTERS);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDimension = useCallback(
    (dimension: SegmentDimension) => {
      setFilters((prev) => {
        const next = { ...prev, dimension };
        fetchSegments(next);
        return next;
      });
    },
    [fetchSegments]
  );

  const setDatePreset = useCallback(
    (preset: DatePreset) => {
      if (preset === "custom") {
        // Just switch to custom mode, keep current dates
        setFilters((prev) => ({ ...prev, datePreset: "custom" }));
        return;
      }
      const { dateFrom, dateTo } = getDateRange(preset);
      setFilters((prev) => {
        const next = { ...prev, datePreset: preset, dateFrom, dateTo };
        fetchSegments(next);
        return next;
      });
    },
    [fetchSegments]
  );

  const setCustomDateRange = useCallback(
    (dateFrom: string, dateTo: string) => {
      setFilters((prev) => {
        const next = { ...prev, datePreset: "custom" as DatePreset, dateFrom, dateTo };
        fetchSegments(next);
        return next;
      });
    },
    [fetchSegments]
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    fetchSegments(DEFAULT_FILTERS);
  }, [fetchSegments]);

  const refetch = useCallback(() => {
    fetchSegments(filters);
  }, [fetchSegments, filters]);

  return {
    data,
    loading,
    error,
    filters,
    setDimension,
    setDatePreset,
    setCustomDateRange,
    resetFilters,
    refetch,
  };
}
