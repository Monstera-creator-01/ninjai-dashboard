"use client";

import React, { useState, useMemo } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentDetailPanel } from "@/components/segment-detail-panel";
import type { SegmentData, SegmentDimension } from "@/lib/types/segments";

interface SegmentComparisonTableProps {
  segments: SegmentData[];
  dimension: SegmentDimension;
}

type SortField = "segment" | "conversations" | "replyRate" | "avgDepth";
type SortDirection = "asc" | "desc";

function CategoryBreakdownBar({ segment }: { segment: SegmentData }) {
  const tagged = segment.categoryBreakdown.filter(
    (item) => item.category !== "untagged"
  );
  const totalTagged = tagged.reduce((sum, item) => sum + item.count, 0);

  if (totalTagged === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">&mdash;</span>
    );
  }

  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full"
      role="img"
      aria-label={`Kategorien: ${tagged.map((t) => `${t.label} ${t.percentage}%`).join(", ")}`}
    >
      {tagged.map((item) => {
        const width = totalTagged > 0 ? (item.count / totalTagged) * 100 : 0;
        return (
          <div
            key={item.category}
            className="h-full transition-all"
            style={{
              width: `${width}%`,
              backgroundColor: item.color,
              minWidth: width > 0 ? "2px" : 0,
            }}
            title={`${item.label}: ${item.count} (${item.percentage}%)`}
          />
        );
      })}
    </div>
  );
}

export function SegmentComparisonTable({
  segments,
  dimension,
}: SegmentComparisonTableProps) {
  const PAGE_SIZE = 15;
  const [sortField, setSortField] = useState<SortField>("conversations");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSortInternal = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedSegments = useMemo(() => {
    const sorted = [...segments];
    sorted.sort((a, b) => {
      let valueA: number | string;
      let valueB: number | string;

      switch (sortField) {
        case "segment":
          valueA = a.segmentValue.toLowerCase();
          valueB = b.segmentValue.toLowerCase();
          break;
        case "conversations":
          valueA = a.conversationCount;
          valueB = b.conversationCount;
          break;
        case "replyRate":
          valueA = a.replyRate;
          valueB = b.replyRate;
          break;
        case "avgDepth":
          valueA = a.avgDepth;
          valueB = b.avgDepth;
          break;
        default:
          return 0;
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      const numA = valueA as number;
      const numB = valueB as number;
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });
    return sorted;
  }, [segments, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedSegments.length / PAGE_SIZE);
  const paginatedSegments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedSegments.slice(start, start + PAGE_SIZE);
  }, [sortedSegments, currentPage]);

  // Reset page when sort changes or segments change
  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    handleSortInternal(field);
  };

  const toggleRow = (segmentValue: string) => {
    setExpandedRow((prev) => (prev === segmentValue ? null : segmentValue));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]" />
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-medium hover:bg-transparent"
                onClick={() => handleSort("segment")}
                aria-label="Sort by segment"
              >
                Segment
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-medium hover:bg-transparent"
                onClick={() => handleSort("conversations")}
                aria-label="Sort by conversations"
              >
                Conversations
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-medium hover:bg-transparent"
                onClick={() => handleSort("replyRate")}
                aria-label="Sort by reply rate"
              >
                Reply Rate
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-medium hover:bg-transparent"
                onClick={() => handleSort("avgDepth")}
                aria-label="Sort by average depth"
              >
                Avg. Depth
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">Top Kategorie</TableHead>
            <TableHead className="hidden lg:table-cell w-[160px]">
              Kategorie-Verteilung
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSegments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                Keine Segmente vorhanden
              </TableCell>
            </TableRow>
          ) : (
            paginatedSegments.map((segment) => {
              const isExpanded = expandedRow === segment.segmentValue;

              return (
                <React.Fragment key={segment.segmentValue}>
                  <TableRow className="group">
                    <TableCell className="w-[30px] px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleRow(segment.segmentValue)}
                        aria-expanded={isExpanded}
                        aria-label={`Details ${isExpanded ? "verbergen" : "anzeigen"} für ${segment.segmentValue}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <button
                        className="flex items-center gap-2 text-left hover:underline cursor-pointer font-medium text-sm"
                        onClick={() => toggleRow(segment.segmentValue)}
                      >
                        <span className="truncate max-w-[200px]">
                          {segment.segmentValue}
                        </span>
                        {segment.isSmallSample && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 shrink-0"
                          >
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                            Kleine Stichprobe
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {segment.conversationCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {segment.replyRate}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {segment.avgDepth}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {segment.topCategory ?? (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell w-[160px]">
                      <CategoryBreakdownBar segment={segment} />
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <SegmentDetailPanel
                          segment={segment}
                          dimension={dimension}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-xs text-muted-foreground">
            {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, sortedSegments.length)} von{" "}
            {sortedSegments.length} Segmenten
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Vorherige Seite"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Nächste Seite"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
