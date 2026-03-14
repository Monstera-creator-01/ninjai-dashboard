"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeeklyReviewResponse } from "@/lib/types/weekly-review";

interface UseWeeklyReviewReturn {
  data: WeeklyReviewResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  refetch: () => void;
}

export function useWeeklyReview(): UseWeeklyReviewReturn {
  const [data, setData] = useState<WeeklyReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  const fetchWeeklyReview = useCallback(
    async (weekStart?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        const week = weekStart ?? selectedWeek;
        if (week) {
          params.set("week_start", week);
        }

        const url = `/api/campaigns/weekly-review${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Request failed with status ${response.status}`
          );
        }

        const json: WeeklyReviewResponse = await response.json();
        setData(json);

        // Set selected week from response if not already set
        if (!weekStart && !selectedWeek && json.selectedWeek) {
          setSelectedWeek(json.selectedWeek);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load weekly review";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedWeek]
  );

  // Initial fetch
  useEffect(() => {
    fetchWeeklyReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when selected week changes (but not on initial render)
  const handleWeekChange = useCallback(
    (week: string) => {
      setSelectedWeek(week);
      fetchWeeklyReview(week);
    },
    [fetchWeeklyReview]
  );

  return {
    data,
    isLoading,
    error,
    selectedWeek: selectedWeek || data?.selectedWeek || "",
    setSelectedWeek: handleWeekChange,
    refetch: () => fetchWeeklyReview(selectedWeek || undefined),
  };
}
