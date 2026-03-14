"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/severity-badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Flag } from "@/lib/types/flags";
import { FLAG_TYPE_LABELS } from "@/lib/types/flags";

interface FlagHistoryTableProps {
  flags: Flag[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "--";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FlagHistoryTable({
  flags,
  totalCount,
  page,
  pageSize,
  onPageChange,
}: FlagHistoryTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const showPagination = totalPages > 1;

  if (flags.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No resolved flags yet.</p>
        <p className="text-sm mt-1">
          Flags will appear here once they are resolved or dismissed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Flag Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Triggered Value</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Resolved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.map((flag) => (
              <TableRow key={flag.id}>
                <TableCell className="font-medium">{flag.workspace}</TableCell>
                <TableCell>{FLAG_TYPE_LABELS[flag.flag_type]}</TableCell>
                <TableCell>
                  <SeverityBadge severity={flag.severity} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {flag.triggered_value}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      flag.resolution_type === "auto"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {flag.resolution_type === "auto"
                      ? "Auto-resolved"
                      : "Manually dismissed"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {flag.acknowledgment_note || "--"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(flag.created_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(flag.resolved_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalCount)} of {totalCount} resolved
            flags
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
