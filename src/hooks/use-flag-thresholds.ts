"use client";

import { useState, useEffect, useCallback } from "react";
import type { FlagThreshold, FlagThresholdsResponse } from "@/lib/types/flags";

interface UseFlagThresholdsReturn {
  thresholds: FlagThreshold[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFlagThresholds(): UseFlagThresholdsReturn {
  const [thresholds, setThresholds] = useState<FlagThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flags/thresholds");

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ?? `Request failed with status ${response.status}`
        );
      }

      const json: FlagThresholdsResponse = await response.json();
      setThresholds(json.thresholds);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load thresholds";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  return { thresholds, isLoading, error, refetch: fetchThresholds };
}

interface UseUpdateThresholdReturn {
  updateThreshold: (
    id: string,
    updates: { threshold_value?: number; enabled?: boolean }
  ) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

export function useUpdateThreshold(): UseUpdateThresholdReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateThreshold = useCallback(
    async (
      id: string,
      updates: { threshold_value?: number; enabled?: boolean }
    ): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/flags/thresholds", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updates }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          return {
            success: false,
            error: body.error ?? "Failed to update threshold",
          };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to update threshold",
        };
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return { updateThreshold, isSubmitting };
}
