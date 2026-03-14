"use client";

import { FlagCard } from "@/components/flag-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Flag } from "@/lib/types/flags";

interface FlagListProps {
  flags: Flag[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onAcknowledge: (flag: Flag) => void;
  onDismiss: (flagId: string) => void;
  isSubmitting: boolean;
}

export function FlagList({
  flags,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onAcknowledge,
  onDismiss,
  isSubmitting,
}: FlagListProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const showPagination = totalPages > 1;

  return (
    <div className="space-y-4">
      {/* Flag cards */}
      <div className="space-y-3">
        {flags.map((flag) => (
          <FlagCard
            key={flag.id}
            flag={flag}
            onAcknowledge={onAcknowledge}
            onDismiss={onDismiss}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalCount)} of {totalCount} flags
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
