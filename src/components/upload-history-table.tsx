import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UploadHistoryRow {
  id: number;
  filename: string;
  csv_type: "activity_metrics" | "conversation_data";
  row_count: number;
  status: "success" | "error";
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
  return (
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
                    ) : (
                      <Badge
                        variant="destructive"
                        title={row.error_message ?? undefined}
                      >
                        Error
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
