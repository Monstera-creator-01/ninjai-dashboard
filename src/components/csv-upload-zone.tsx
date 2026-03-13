"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ACTIVITY_METRICS_COLUMNS = [
  "workspace",
  "date",
  "profile_views",
  "post_likes",
  "follows",
  "messages_sent",
  "total_message_started",
  "total_message_replies",
  "inmail_messages_sent",
  "total_inmail_started",
  "total_inmail_replies",
  "connections_sent",
  "connections_accepted",
  "message_reply_rate",
  "inmail_reply_rate",
  "connection_acceptance_rate",
] as const;

const CONVERSATION_COLUMNS = [
  "workspace",
  "conversation_id",
  "read",
  "last_message_at",
  "last_message_sender",
  "is_inbound_reply",
  "total_messages",
  "inbound_message_count",
  "outbound_message_count",
  "conversation_depth_category",
  "lead_first_name",
  "lead_last_name",
  "lead_headline",
  "lead_position",
  "lead_company",
  "lead_location",
  "lead_profile_url",
  "sender_name",
  "sender_email",
  "sender_profile_url",
  "sender_account_id",
  "last_message_text",
  "first_outbound_message",
  "first_inbound_reply",
] as const;

type CsvType = "activity_metrics" | "conversation_data";

interface ValidationResult {
  valid: boolean;
  csvType: CsvType | null;
  rowCount: number;
  errors: string[];
}

interface UploadResult {
  rowCount: number;
  inserted: number;
  updated: number;
  csvType: CsvType;
}

function detectCsvType(headers: string[]): CsvType | null {
  const headerSet = new Set(headers.map((h) => h.trim().toLowerCase()));
  if (ACTIVITY_METRICS_COLUMNS.every((col) => headerSet.has(col.toLowerCase())))
    return "activity_metrics";
  if (CONVERSATION_COLUMNS.every((col) => headerSet.has(col.toLowerCase())))
    return "conversation_data";
  return null;
}

function validateFile(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    if (file.size > MAX_FILE_SIZE) {
      resolve({
        valid: false,
        csvType: null,
        rowCount: 0,
        errors: [
          `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB. Try splitting the file.`,
        ],
      });
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      resolve({
        valid: false,
        csvType: null,
        rowCount: 0,
        errors: ["Only .csv files are supported."],
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 2, // Just need headers + 1 row to validate, full parse for row count
      complete: () => {
        // Re-parse without preview to get accurate row count
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (fullResult) => {
            const headers = fullResult.meta.fields ?? [];
            const rowCount = fullResult.data.length;
            const errors: string[] = [];

            if (rowCount === 0) {
              errors.push("No data rows found. The file appears to be empty.");
              resolve({ valid: false, csvType: null, rowCount: 0, errors });
              return;
            }

            const csvType = detectCsvType(headers);

            if (!csvType) {
              // Show which required columns are missing for the closer match
              const missingActivity = ACTIVITY_METRICS_COLUMNS.filter(
                (col) =>
                  !headers
                    .map((h) => h.trim().toLowerCase())
                    .includes(col.toLowerCase())
              );
              const missingConv = CONVERSATION_COLUMNS.filter(
                (col) =>
                  !headers
                    .map((h) => h.trim().toLowerCase())
                    .includes(col.toLowerCase())
              );
              const missing =
                missingActivity.length <= missingConv.length
                  ? missingActivity
                  : missingConv;
              const displayMissing = missing.slice(0, 5);
              const moreCount = missing.length - displayMissing.length;
              errors.push(
                `Unrecognized CSV format. Missing required columns: ${displayMissing.join(", ")}${moreCount > 0 ? ` and ${moreCount} more` : ""}.`
              );
              resolve({ valid: false, csvType: null, rowCount, errors });
              return;
            }

            resolve({ valid: true, csvType, rowCount, errors: [] });
          },
        });
      },
    });
  });
}

const CSV_TYPE_LABELS: Record<CsvType, string> = {
  activity_metrics: "Activity Metrics",
  conversation_data: "Conversation Data",
};

interface CsvUploadZoneProps {
  onUploadComplete?: () => void;
}

export function CsvUploadZone({ onUploadComplete }: CsvUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setValidation(null);
    setUploadResult(null);
    setUploadError(null);
    setIsValidating(true);

    const result = await validateFile(file);
    setValidation(result);
    setIsValidating(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleClear = () => {
    setSelectedFile(null);
    setValidation(null);
    setUploadResult(null);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !validation?.valid) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85));
    }, 400);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || "Upload failed. Please try again.");
        return;
      }

      setUploadResult(data as UploadResult);
      setSelectedFile(null);
      setValidation(null);
      onUploadComplete?.();
    } catch {
      clearInterval(progressInterval);
      setUploadError("An unexpected error occurred. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Success result */}
      {uploadResult && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="flex items-start gap-3 pt-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Import successful
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {uploadResult.rowCount} rows processed —{" "}
                {uploadResult.inserted} imported
                {uploadResult.updated > 0 &&
                  `, ${uploadResult.updated} updated`}
              </p>
              <button
                onClick={handleClear}
                className="text-xs text-green-600 underline hover:text-green-700"
              >
                Import another file
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drop zone — only shown when no file selected and no success result */}
      {!selectedFile && !uploadResult && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30"
          )}
        >
          <UploadCloud className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drag a CSV here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Activity Metrics or Conversation Data — max 10MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* File preview card */}
      {selectedFile && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                disabled={isUploading || isValidating}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Validating spinner */}
            {isValidating && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analysing file...
              </div>
            )}

            {/* Validation result */}
            {validation && !isValidating && (
              <div className="mt-3 space-y-2">
                {validation.valid && validation.csvType ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {CSV_TYPE_LABELS[validation.csvType]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {validation.rowCount.toLocaleString()} rows
                    </span>
                    <span className="text-xs text-green-600">
                      Ready to import
                    </span>
                  </div>
                ) : (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">
                      {validation.errors[0]}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Upload error from server */}
            {uploadError && (
              <Alert variant="destructive" className="mt-3 py-2">
                <AlertDescription className="text-xs">
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}

            {/* Progress bar during upload */}
            {isUploading && (
              <div className="mt-3 space-y-1">
                <Progress value={uploadProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  Uploading and processing...
                </p>
              </div>
            )}

            {/* Upload button */}
            {!isUploading && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!validation?.valid || isValidating}
                  size="sm"
                >
                  Import CSV
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
