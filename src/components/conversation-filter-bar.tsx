"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { REPLY_CATEGORIES } from "@/lib/types/messaging";
import type { ConversationFilters } from "@/lib/types/messaging";
import { cn } from "@/lib/utils";

interface ConversationFilterBarProps {
  filters: ConversationFilters;
  onChange: (filters: Partial<ConversationFilters>) => void;
  onReset: () => void;
  workspaces: string[];
  senders: string[];
}

const DEPTH_OPTIONS = ["1-touch", "2-touch", "3+ touch"];
const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "depth_desc", label: "Most messages" },
  { value: "depth_asc", label: "Fewest messages" },
  { value: "workspace", label: "Workspace A-Z" },
];

export function ConversationFilterBar({
  filters,
  onChange,
  onReset,
  workspaces,
  senders,
}: ConversationFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const hasActiveFilters =
    filters.workspace.length > 0 ||
    filters.depth.length > 0 ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.sender !== "" ||
    filters.replied !== "all" ||
    filters.category !== "all" ||
    filters.search !== "";

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (value.length >= 2 || value.length === 0) {
      onChange({ search: value });
    }
  };

  return (
    <div className="space-y-3">
      {/* Search + Sort row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search messages, names, companies..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search conversations"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={filters.sort} onValueChange={(v) => onChange({ sort: v })}>
          <SelectTrigger className="w-[160px]" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Workspace (multi-select) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs w-[160px] justify-between"
              aria-label="Workspace filter"
            >
              {filters.workspace.length === 0
                ? "All workspaces"
                : filters.workspace.length === 1
                  ? filters.workspace[0]
                  : `${filters.workspace.length} workspaces`}
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <div className="space-y-1">
              {workspaces.map((ws) => {
                const isSelected = filters.workspace.includes(ws);
                return (
                  <button
                    key={ws}
                    className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs hover:bg-muted"
                    onClick={() => {
                      const next = isSelected
                        ? filters.workspace.filter((w) => w !== ws)
                        : [...filters.workspace, ws];
                      onChange({ workspace: next });
                    }}
                  >
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    {ws}
                  </button>
                );
              })}
              {workspaces.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">No workspaces</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Depth (multi-select) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs w-[130px] justify-between"
              aria-label="Depth filter"
            >
              {filters.depth.length === 0
                ? "All depths"
                : filters.depth.length === 1
                  ? filters.depth[0]
                  : `${filters.depth.length} depths`}
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[160px] p-2" align="start">
            <div className="space-y-1">
              {DEPTH_OPTIONS.map((d) => {
                const isSelected = filters.depth.includes(d);
                return (
                  <button
                    key={d}
                    className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs hover:bg-muted"
                    onClick={() => {
                      const next = isSelected
                        ? filters.depth.filter((x) => x !== d)
                        : [...filters.depth, d];
                      onChange({ depth: next });
                    }}
                  >
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    {d}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sender */}
        <Select
          value={filters.sender || "all"}
          onValueChange={(v) => onChange({ sender: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs" aria-label="Sender filter">
            <SelectValue placeholder="All senders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All senders</SelectItem>
            {senders.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reply Status */}
        <Select
          value={filters.replied}
          onValueChange={(v) => onChange({ replied: v })}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Reply status filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All replies</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="not_replied">Not replied</SelectItem>
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          value={filters.category}
          onValueChange={(v) => onChange({ category: v })}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs" aria-label="Category filter">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="untagged">Untagged</SelectItem>
            {REPLY_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs w-[130px] justify-start",
                !filters.dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" aria-hidden="true" />
              {filters.dateFrom
                ? format(new Date(filters.dateFrom), "MMM d, yyyy")
                : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) => {
                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                // If dateFrom > dateTo, also update dateTo
                if (formatted && filters.dateTo && formatted > filters.dateTo) {
                  onChange({ dateFrom: formatted, dateTo: formatted });
                } else {
                  onChange({ dateFrom: formatted });
                }
              }}
              disabled={filters.dateTo ? { after: new Date(filters.dateTo) } : undefined}
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 text-xs w-[130px] justify-start",
                !filters.dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" aria-hidden="true" />
              {filters.dateTo
                ? format(new Date(filters.dateTo), "MMM d, yyyy")
                : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) => {
                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                // If dateTo < dateFrom, also update dateFrom
                if (formatted && filters.dateFrom && formatted < filters.dateFrom) {
                  onChange({ dateTo: formatted, dateFrom: formatted });
                } else {
                  onChange({ dateTo: formatted });
                }
              }}
              disabled={filters.dateFrom ? { before: new Date(filters.dateFrom) } : undefined}
            />
          </PopoverContent>
        </Popover>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={onReset}
          >
            <X className="mr-1 h-3 w-3" aria-hidden="true" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {filters.workspace.map((ws) => (
            <Badge key={ws} variant="secondary" className="text-xs">
              {ws}
              <button
                onClick={() =>
                  onChange({ workspace: filters.workspace.filter((w) => w !== ws) })
                }
                className="ml-1"
                aria-label={`Remove ${ws} filter`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {filters.depth.map((d) => (
            <Badge key={d} variant="secondary" className="text-xs">
              {d}
              <button
                onClick={() =>
                  onChange({ depth: filters.depth.filter((x) => x !== d) })
                }
                className="ml-1"
                aria-label={`Remove ${d} filter`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: {filters.search}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
