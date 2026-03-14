"use client";

import { useState, useEffect, useCallback } from "react";
import type { AMSummaryResponse } from "@/lib/types/am-summary";

interface UseAMSummaryReturn {
  data: AMSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAMSummary(): UseAMSummaryReturn {
  const [data, setData] = useState<AMSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/am-summary");

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${response.status}`);
      }

      const json: AMSummaryResponse = await response.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load AM summary";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
