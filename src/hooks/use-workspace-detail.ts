"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkspaceDetailResponse } from "@/lib/types/campaign";

interface UseWorkspaceDetailReturn {
  data: WorkspaceDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useWorkspaceDetail(
  workspace: string
): UseWorkspaceDetailReturn {
  const [data, setData] = useState<WorkspaceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!workspace) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ workspace });
      const response = await fetch(`/api/campaigns/detail?${params.toString()}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ?? `Request failed with status ${response.status}`
        );
      }

      const json: WorkspaceDetailResponse = await response.json();
      setData(json);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load workspace detail";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, isLoading, error, refetch: fetchDetail };
}
