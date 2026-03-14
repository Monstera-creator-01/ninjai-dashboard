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
import type { SenderBreakdown } from "@/lib/types/weekly-review";

interface SenderBreakdownTableProps {
  senders: SenderBreakdown[];
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "--";
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function SenderBreakdownTable({ senders }: SenderBreakdownTableProps) {
  if (senders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No sender activity data available for this week.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sender</TableHead>
          <TableHead className="text-right">Conversations</TableHead>
          <TableHead className="text-right">Replies</TableHead>
          <TableHead className="text-right">Last Active</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {senders.map((sender) => (
          <TableRow key={sender.senderName}>
            <TableCell className="font-medium">{sender.senderName}</TableCell>
            <TableCell className="text-right tabular-nums">
              {sender.conversationCount}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {sender.replyCount}
            </TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {formatDate(sender.lastActiveDate)}
            </TableCell>
            <TableCell className="text-right">
              {sender.isInactive ? (
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-800 border-red-200"
                  aria-label="Sender inactive"
                >
                  Inactive
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-100 text-emerald-800 border-emerald-200"
                  aria-label="Sender active"
                >
                  Active
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
