"use client";

import { useState, useEffect, useCallback } from "react";
import type { OperatorDashboardResponse } from "@/lib/types/operator";

interface UseOperatorDashboardReturn {
  data: OperatorDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedWorkspace: string;
  setSelectedWorkspace: (workspace: string) => void;
  refetch: () => void;
}

export function useOperatorDashboard(): UseOperatorDashboardReturn {
  const [data, setData] = useState<OperatorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");

  const fetchData = useCallback(
    async (date?: string, workspace?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        const d = date ?? selectedDate;
        const w = workspace ?? selectedWorkspace;

        if (d) {
          params.set("date", d);
        }
        if (w && w !== "all") {
          params.set("workspace", w);
        }

        const url = `/api/campaigns/operator${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Request failed with status ${response.status}`
          );
        }

        const json: OperatorDashboardResponse = await response.json();
        setData(json);

        // Set selected date from response if not already set
        if (!d && json.latestDate) {
          setSelectedDate(json.latestDate);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load operator dashboard";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate, selectedWorkspace]
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = useCallback(
    (date: string) => {
      setSelectedDate(date);
      fetchData(date, selectedWorkspace);
    },
    [fetchData, selectedWorkspace]
  );

  const handleWorkspaceChange = useCallback(
    (workspace: string) => {
      setSelectedWorkspace(workspace);
      fetchData(selectedDate || undefined, workspace);
    },
    [fetchData, selectedDate]
  );

  return {
    data,
    isLoading,
    error,
    selectedDate: selectedDate || data?.latestDate || "",
    setSelectedDate: handleDateChange,
    selectedWorkspace,
    setSelectedWorkspace: handleWorkspaceChange,
    refetch: () =>
      fetchData(selectedDate || undefined, selectedWorkspace),
  };
}
