"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadHistoryRow {
  id: number;
  filename: string;
  csv_type: "activity_metrics" | "conversation_data";
  row_count: number;
  status: "processing" | "success" | "error";
  error_message: string | null;
  uploaded_at: string;
  profiles: { full_name: string | null } | null;
}

const CSV_TYPE_LABELS: Record<string, string> = {
  activity_metrics: "Activity Metrics",
  conversation_data: "Conversation Data",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface UploadHistoryTableProps {
  rows: UploadHistoryRow[];
}

export function UploadHistoryTable({ rows }: UploadHistoryTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<UploadHistoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/import", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Failed to delete import",
          description: data.error ?? "Unknown error",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Import deleted",
        description: `Removed "${deleteTarget.filename}" and ${data.deletedRows} data row${data.deletedRows === 1 ? "" : "s"}.`,
      });

      router.refresh();
    } catch {
      toast({
        title: "Failed to delete import",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No imports yet — upload your first CSV above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell
                      className="max-w-[200px] truncate font-medium"
                      title={row.filename}
                    >
                      {row.filename}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CSV_TYPE_LABELS[row.csv_type] ?? row.csv_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.row_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.profiles?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.uploaded_at)}
                    </TableCell>
                    <TableCell>
                      {row.status === "success" ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          Success
                        </Badge>
                      ) : row.status === "processing" ? (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        >
                          Processing
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          title={row.error_message ?? undefined}
                        >
                          Error
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(row)}
                        aria-label={`Delete import ${row.filename}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Import</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.filename}</strong> and
              remove its associated data rows from the database. Rows that were
              updated by a later import will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Prevent auto-close so loading state is visible
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
