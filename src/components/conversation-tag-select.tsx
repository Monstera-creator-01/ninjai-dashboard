"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPLY_CATEGORIES } from "@/lib/types/messaging";
import type { ReplyCategory } from "@/lib/types/messaging";

interface ConversationTagSelectProps {
  value: ReplyCategory | null;
  onChange: (category: ReplyCategory | null) => void;
  compact?: boolean;
}

export function ConversationTagSelect({
  value,
  onChange,
  compact = false,
}: ConversationTagSelectProps) {
  return (
    <Select
      value={value ?? "none"}
      onValueChange={(v) => onChange(v === "none" ? null : (v as ReplyCategory))}
    >
      <SelectTrigger
        className={compact ? "h-7 w-[140px] text-xs" : "w-[180px]"}
        aria-label="Tag conversation"
      >
        <SelectValue placeholder="Tag..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No tag</span>
        </SelectItem>
        {REPLY_CATEGORIES.map((cat) => (
          <SelectItem key={cat.value} value={cat.value}>
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
