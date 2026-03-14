"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkspaceFilterProps {
  workspaces: string[];
  value: string;
  onChange: (value: string) => void;
}

export function WorkspaceFilter({
  workspaces,
  value,
  onChange,
}: WorkspaceFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="workspace-filter"
        className="text-sm font-medium text-muted-foreground whitespace-nowrap"
      >
        Filter by workspace:
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="workspace-filter"
          className="w-[200px]"
          aria-label="Filter workspaces"
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
  );
}
