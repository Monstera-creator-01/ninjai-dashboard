"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  SEGMENT_DIMENSIONS,
  DATE_PRESETS,
} from "@/lib/types/segments";
import type {
  SegmentDimension,
  DatePreset,
  SegmentFilters,
} from "@/lib/types/segments";
import { cn } from "@/lib/utils";

interface SegmentFilterBarProps {
  filters: SegmentFilters;
  onDimensionChange: (dimension: SegmentDimension) => void;
  onDatePresetChange: (preset: DatePreset) => void;
  onCustomDateChange: (dateFrom: string, dateTo: string) => void;
}

export function SegmentFilterBar({
  filters,
  onDimensionChange,
  onDatePresetChange,
  onCustomDateChange,
}: SegmentFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Dimension Selector (AC-1) */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="dimension-select"
          className="text-sm font-medium text-muted-foreground whitespace-nowrap"
        >
          Vergleich nach:
        </label>
        <Select
          value={filters.dimension}
          onValueChange={(v) => onDimensionChange(v as SegmentDimension)}
        >
          <SelectTrigger
            id="dimension-select"
            className="w-[180px]"
            aria-label="Vergleichsdimension"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEGMENT_DIMENSIONS.map((dim) => (
              <SelectItem key={dim.value} value={dim.value}>
                {dim.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Presets (AC-2) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {DATE_PRESETS.filter((p) => p.value !== "custom").map((preset) => (
          <Button
            key={preset.value}
            variant={filters.datePreset === preset.value ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => onDatePresetChange(preset.value)}
            aria-label={`Zeitraum: ${preset.label}`}
            aria-pressed={filters.datePreset === preset.value}
          >
            {preset.label}
          </Button>
        ))}

        {/* Custom Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={filters.datePreset === "custom" ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 text-xs w-[130px] justify-start",
                filters.datePreset !== "custom" && !filters.dateFrom && "text-muted-foreground"
              )}
              aria-label="Startdatum"
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" aria-hidden="true" />
              {filters.datePreset === "custom" && filters.dateFrom
                ? format(new Date(filters.dateFrom), "dd.MM.yyyy")
                : filters.datePreset !== "custom" && filters.dateFrom
                  ? format(new Date(filters.dateFrom), "dd.MM.yyyy")
                  : "Von"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) => {
                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                if (formatted && filters.dateTo && formatted > filters.dateTo) {
                  onCustomDateChange(formatted, formatted);
                } else {
                  onCustomDateChange(formatted, filters.dateTo);
                }
              }}
              disabled={filters.dateTo ? { after: new Date(filters.dateTo) } : undefined}
            />
          </PopoverContent>
        </Popover>

        {/* Custom Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={filters.datePreset === "custom" ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 text-xs w-[130px] justify-start",
                filters.datePreset !== "custom" && !filters.dateTo && "text-muted-foreground"
              )}
              aria-label="Enddatum"
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" aria-hidden="true" />
              {filters.datePreset === "custom" && filters.dateTo
                ? format(new Date(filters.dateTo), "dd.MM.yyyy")
                : filters.datePreset !== "custom" && filters.dateTo
                  ? format(new Date(filters.dateTo), "dd.MM.yyyy")
                  : "Bis"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) => {
                const formatted = date ? format(date, "yyyy-MM-dd") : "";
                if (formatted && filters.dateFrom && formatted < filters.dateFrom) {
                  onCustomDateChange(formatted, formatted);
                } else {
                  onCustomDateChange(filters.dateFrom, formatted);
                }
              }}
              disabled={filters.dateFrom ? { before: new Date(filters.dateFrom) } : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
