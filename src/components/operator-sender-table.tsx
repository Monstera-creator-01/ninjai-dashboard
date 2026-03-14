"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SenderActivity } from "@/lib/types/operator";

interface OperatorSenderTableProps {
  senders: SenderActivity[];
}

const PAGE_SIZE = 15;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function OperatorSenderTable({ senders }: OperatorSenderTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Sort by workspace, then by conversation count descending
  const sortedSenders = useMemo(() => {
    return [...senders].sort((a, b) => {
      const wsCompare = a.workspace.localeCompare(b.workspace);
      if (wsCompare !== 0) return wsCompare;
      return b.conversationCount - a.conversationCount;
    });
  }, [senders]);

  const totalPages = Math.max(1, Math.ceil(sortedSenders.length / PAGE_SIZE));
  const paginatedSenders = sortedSenders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Count stats
  const activeCount = senders.filter((s) => !s.isInactive).length;
  const inactiveCount = senders.filter((s) => s.isInactive).length;

  // No conversation data
  if (senders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden="true" />
            Sender Activity
          </CardTitle>
          <CardDescription>
            Sender performance from conversation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquareText
              className="h-8 w-8 text-muted-foreground mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-muted-foreground">
              No conversation data available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a conversation CSV to see sender activity.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden="true" />
              Sender Activity
            </CardTitle>
            <CardDescription>
              {senders.length} sender{senders.length !== 1 ? "s" : ""} across
              workspaces
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              {activeCount} active
            </Badge>
            {inactiveCount > 0 && (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                {inactiveCount} inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead className="text-right">Conversations</TableHead>
                <TableHead className="text-right">Replies</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSenders.map((sender, idx) => (
                <TableRow
                  key={`${sender.workspace}-${sender.senderName}-${idx}`}
                >
                  <TableCell className="font-medium">
                    {sender.senderName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {sender.workspace}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {sender.conversationCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {sender.replyCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(sender.lastActiveDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        sender.isInactive
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}
                    >
                      {sender.isInactive ? "Inactive" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, sortedSenders.length)} of{" "}
              {sortedSenders.length} senders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
