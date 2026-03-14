"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface WeekSelectorProps {
  availableWeeks: string[];
  selectedWeek: string;
  onWeekChange: (week: string) => void;
}

function formatWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00Z");
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

  const monLabel = formatDate(monday);
  const sunLabel = formatDate(sunday);
  const year = monday.getUTCFullYear();

  return `${monLabel} - ${sunLabel}, ${year}`;
}

export function WeekSelector({
  availableWeeks,
  selectedWeek,
  onWeekChange,
}: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <label
        htmlFor="week-selector"
        className="text-sm font-medium text-muted-foreground whitespace-nowrap"
      >
        Week:
      </label>
      <Select value={selectedWeek} onValueChange={onWeekChange}>
        <SelectTrigger
          id="week-selector"
          className="w-[260px]"
          aria-label="Select week to review"
        >
          <SelectValue placeholder="Select a week" />
        </SelectTrigger>
        <SelectContent>
          {availableWeeks.map((week) => (
            <SelectItem key={week} value={week}>
              {formatWeekLabel(week)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
