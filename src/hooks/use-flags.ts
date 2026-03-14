"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  FlagsResponse,
  FlagFilters,
  FlagStatus,
  FlagSeverity,
} from "@/lib/types/flags";

interface UseFlagsReturn {
  data: FlagsResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFlags(
  filters: FlagFilters,
  tab: "active" | "history" = "active",
  page: number = 1
): UseFlagsReturn {
  const [data, setData] = useState<FlagsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (tab === "history") {
        params.set("status", "resolved");
      } else if (filters.status !== "all") {
        params.set("status", filters.status);
      }

      if (filters.severity !== "all") {
        params.set("severity", filters.severity);
      }

      if (filters.workspace && filters.workspace !== "all") {
        params.set("workspace", filters.workspace);
      }

      params.set("page", String(page));
      params.set("pageSize", "10");

      const url = `/api/flags${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ?? `Request failed with status ${response.status}`
        );
      }

      const json: FlagsResponse = await response.json();
      setData(json);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load flags";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters.status, filters.severity, filters.workspace, tab, page]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return { data, isLoading, error, refetch: fetchFlags };
}

interface UseFlagCountReturn {
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFlagCount(): UseFlagCountReturn {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flags/count");

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ?? `Request failed with status ${response.status}`
        );
      }

      const json = await response.json();
      setCount(json.count ?? 0);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load flag count";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, isLoading, error, refetch: fetchCount };
}

interface UseFlagActionsReturn {
  acknowledgeFlag: (
    flagId: string,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
  dismissFlag: (
    flagId: string
  ) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

export function useFlagActions(): UseFlagActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acknowledgeFlag = useCallback(
    async (
      flagId: string,
      note?: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/flags", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: flagId,
            action: "acknowledge",
            note: note || null,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          return {
            success: false,
            error: body.error ?? "Failed to acknowledge flag",
          };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to acknowledge flag",
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const dismissFlag = useCallback(
    async (
      flagId: string
    ): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/flags", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: flagId,
            action: "dismiss",
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          return {
            success: false,
            error: body.error ?? "Failed to dismiss flag",
          };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to dismiss flag",
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { acknowledgeFlag, dismissFlag, isSubmitting };
}
