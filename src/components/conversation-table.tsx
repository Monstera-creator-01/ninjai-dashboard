"use client";

import { useState, Fragment } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConversationTagSelect } from "@/components/conversation-tag-select";
import { ConversationDetailRow } from "@/components/conversation-detail-row";
import type {
  ConversationWithTag,
  ConversationsResponse,
  ReplyCategory,
  TagUpdateRequest,
} from "@/lib/types/messaging";
import { REPLY_CATEGORIES } from "@/lib/types/messaging";
import { cn } from "@/lib/utils";

interface ConversationTableProps {
  data: ConversationsResponse;
  onPageChange: (page: number) => void;
  onTagUpdate: (req: TagUpdateRequest) => Promise<unknown>;
}

export function ConversationTable({
  data,
  onPageChange,
  onTagUpdate,
}: ConversationTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleTagChange = (conversationId: string, category: ReplyCategory | null) => {
    onTagUpdate({ conversationId, category });
  };

  const handleNotableToggle = (c: ConversationWithTag) => {
    onTagUpdate({
      conversationId: c.conversation_id,
      category: c.tag_category,
      isNotable: !c.is_notable,
    });
  };

  const getCategoryColor = (category: ReplyCategory | null): string | undefined => {
    if (!category) return undefined;
    return REPLY_CATEGORIES.find((c) => c.value === category)?.color;
  };

  // Generate page numbers to display
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const total = data.totalPages;
    const current = data.page;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // ellipsis
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1); // ellipsis
      pages.push(total);
    }
    return pages;
  };

  if (data.conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No conversations match your criteria.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or clearing them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Lead</TableHead>
              <TableHead>Workspace</TableHead>
              <TableHead>Depth</TableHead>
              <TableHead>Last Message</TableHead>
              <TableHead>Reply</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.conversations.map((c) => {
              const isExpanded = expandedId === c.conversation_id;
              const leadName = [c.lead_first_name, c.lead_last_name]
                .filter(Boolean)
                .join(" ");
              const catColor = getCategoryColor(c.tag_category);

              return (
                <Fragment key={c.conversation_id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      isExpanded && "bg-muted/30"
                    )}
                    onClick={() => toggleExpand(c.conversation_id)}
                  >
                    <TableCell className="p-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[120px]">
                        <p className="font-medium text-sm truncate">
                          {leadName || "Unknown"}
                        </p>
                        {c.lead_company && (
                          <p className="text-xs text-muted-foreground truncate">
                            {c.lead_company}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {c.workspace}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.conversation_depth_category && (
                        <Badge variant="secondary" className="text-xs">
                          {c.conversation_depth_category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.last_message_at
                        ? format(new Date(c.last_message_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {c.is_inbound_reply ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                          Replied
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No reply
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {catColor && (
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                        )}
                        <ConversationTagSelect
                          value={c.tag_category}
                          onChange={(cat) => handleTagChange(c.conversation_id, cat)}
                          compact
                        />
                      </div>
                    </TableCell>
                    <TableCell
                      className="p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleNotableToggle(c)}
                        aria-label={
                          c.is_notable ? "Remove notable flag" : "Mark as notable"
                        }
                      >
                        <Star
                          className={cn(
                            "h-3.5 w-3.5",
                            c.is_notable
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          )}
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <ConversationDetailRow conversation={c} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(data.page - 1) * data.pageSize + 1}–
            {Math.min(data.page * data.pageSize, data.total)} of {data.total}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (data.page > 1) onPageChange(data.page - 1);
                  }}
                  className={cn(data.page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {getPageNumbers().map((p, i) =>
                p === -1 ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <span className="px-2 text-muted-foreground">...</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(p);
                      }}
                      isActive={p === data.page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (data.page < data.totalPages) onPageChange(data.page + 1);
                  }}
                  className={cn(
                    data.page >= data.totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
