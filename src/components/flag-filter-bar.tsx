"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlagFilters, FlagSeverity, FlagStatus } from "@/lib/types/flags";

interface FlagFilterBarProps {
  filters: FlagFilters;
  onFiltersChange: (filters: FlagFilters) => void;
  workspaces: string[];
  showStatusFilter?: boolean;
}

export function FlagFilterBar({
  filters,
  onFiltersChange,
  workspaces,
  showStatusFilter = true,
}: FlagFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {showStatusFilter && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-muted-foreground whitespace-nowrap"
          >
            Status:
          </label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as FlagStatus | "all",
              })
            }
          >
            <SelectTrigger
              id="status-filter"
              className="w-[160px]"
              aria-label="Filter by status"
            >
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label
          htmlFor="severity-filter"
          className="text-sm font-medium text-muted-foreground whitespace-nowrap"
        >
          Severity:
        </label>
        <Select
          value={filters.severity}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              severity: value as FlagSeverity | "all",
            })
          }
        >
          <SelectTrigger
            id="severity-filter"
            className="w-[140px]"
            aria-label="Filter by severity"
          >
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label
          htmlFor="workspace-filter"
          className="text-sm font-medium text-muted-foreground whitespace-nowrap"
        >
          Workspace:
        </label>
        <Select
          value={filters.workspace}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, workspace: value })
          }
        >
          <SelectTrigger
            id="workspace-filter"
            className="w-[200px]"
            aria-label="Filter by workspace"
          >
            <SelectValue placeholder="All workspaces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All workspaces</SelectItem>
            {workspaces.map((ws) => (
              <SelectItem key={ws} value={ws}>
                {ws}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
