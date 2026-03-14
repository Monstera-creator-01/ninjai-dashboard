"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ConversationFilters,
  ConversationsResponse,
  ConversationsSummaryResponse,
  TagUpdateRequest,
  TagUpdateResponse,
} from "@/lib/types/messaging";

const DEFAULT_FILTERS: ConversationFilters = {
  workspace: [],
  depth: [],
  dateFrom: "",
  dateTo: "",
  sender: "",
  replied: "all",
  category: "all",
  search: "",
  sort: "date_desc",
  page: 1,
};

function buildQueryParams(filters: ConversationFilters): string {
  const params = new URLSearchParams();

  if (filters.workspace.length > 0) {
    params.set("workspace", filters.workspace.join(","));
  }
  if (filters.depth.length > 0) {
    params.set("depth", filters.depth.join(","));
  }
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.sender) params.set("sender", filters.sender);
  if (filters.replied !== "all") params.set("replied", filters.replied);
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.search && filters.search.length >= 2) params.set("search", filters.search);
  if (filters.sort !== "date_desc") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

interface UseMessagingInsightsReturn {
  // Conversations list
  conversations: ConversationsResponse | null;
  conversationsLoading: boolean;
  conversationsError: string | null;

  // Summary data
  summary: ConversationsSummaryResponse | null;
  summaryLoading: boolean;
  summaryError: string | null;

  // Filters
  filters: ConversationFilters;
  setFilters: (filters: Partial<ConversationFilters>) => void;
  resetFilters: () => void;

  // Actions
  updateTag: (req: TagUpdateRequest) => Promise<TagUpdateResponse | null>;
  refetch: () => void;
}

export function useMessagingInsights(): UseMessagingInsightsReturn {
  const [conversations, setConversations] = useState<ConversationsResponse | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  const [summary, setSummary] = useState<ConversationsSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [filters, setFiltersState] = useState<ConversationFilters>(DEFAULT_FILTERS);

  const fetchConversations = useCallback(async (f: ConversationFilters) => {
    setConversationsLoading(true);
    setConversationsError(null);

    try {
      const url = `/api/conversations${buildQueryParams(f)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${response.status}`);
      }

      const json: ConversationsResponse = await response.json();
      setConversations(json);
    } catch (err) {
      setConversationsError(
        err instanceof Error ? err.message : "Failed to load conversations"
      );
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (f: ConversationFilters) => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      // Summary uses same filters except page
      const summaryFilters = { ...f, page: 1 };
      const url = `/api/conversations/summary${buildQueryParams(summaryFilters)}`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${response.status}`);
      }

      const json: ConversationsSummaryResponse = await response.json();
      setSummary(json);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to load summary"
      );
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConversations(DEFAULT_FILTERS);
    fetchSummary(DEFAULT_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilters = useCallback(
    (partial: Partial<ConversationFilters>) => {
      setFiltersState((prev) => {
        const next = { ...prev, ...partial };
        // Reset to page 1 when filters change (unless page is explicitly set)
        if (!("page" in partial)) {
          next.page = 1;
        }
        fetchConversations(next);
        // Only refetch summary when non-page filters change
        if (!("page" in partial) || Object.keys(partial).length > 1) {
          fetchSummary(next);
        }
        return next;
      });
    },
    [fetchConversations, fetchSummary]
  );

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    fetchConversations(DEFAULT_FILTERS);
    fetchSummary(DEFAULT_FILTERS);
  }, [fetchConversations, fetchSummary]);

  const updateTag = useCallback(
    async (req: TagUpdateRequest): Promise<TagUpdateResponse | null> => {
      try {
        const response = await fetch("/api/conversations/tags", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to update tag");
        }

        const result: TagUpdateResponse = await response.json();

        // Optimistically update the conversation in local state
        setConversations((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            conversations: prev.conversations.map((c) =>
              c.conversation_id === req.conversationId
                ? {
                    ...c,
                    tag_category: result.category,
                    is_notable: result.isNotable,
                  }
                : c
            ),
          };
        });

        // Refetch summary to update stats
        fetchSummary(filters);

        return result;
      } catch {
        return null;
      }
    },
    [fetchSummary, filters]
  );

  const refetch = useCallback(() => {
    fetchConversations(filters);
    fetchSummary(filters);
  }, [fetchConversations, fetchSummary, filters]);

  return {
    conversations,
    conversationsLoading,
    conversationsError,
    summary,
    summaryLoading,
    summaryError,
    filters,
    setFilters,
    resetFilters,
    updateTag,
    refetch,
  };
}
