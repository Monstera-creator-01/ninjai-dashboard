"use client";

import { useState, useEffect, useCallback } from "react";
import type { CampaignSnapshotResponse } from "@/lib/types/campaign";

interface UseCampaignSnapshotReturn {
  data: CampaignSnapshotResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCampaignSnapshot(
  workspaceFilter?: string
): UseCampaignSnapshotReturn {
  const [data, setData] = useState<CampaignSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (workspaceFilter) {
        params.set("workspace", workspaceFilter);
      }

      const url = `/api/campaigns/snapshot${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${response.status}`);
      }

      const json: CampaignSnapshotResponse = await response.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load snapshot";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceFilter]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  return { data, isLoading, error, refetch: fetchSnapshot };
}
