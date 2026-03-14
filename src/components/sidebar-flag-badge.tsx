"use client";

import { useFlagCount } from "@/hooks/use-flags";

export function SidebarFlagBadge() {
  const { count, isLoading } = useFlagCount();

  if (isLoading || count === 0) {
    return null;
  }

  return (
    <span
      className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700"
      aria-label={`${count} active flag${count !== 1 ? "s" : ""}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
