import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { evaluateFlags } from "@/lib/flag-evaluation";
import Papa from "papaparse";
import { z } from "zod";

// Required columns for each CSV type
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BATCH_SIZE = 500;

const fileSchema = z.object({
  name: z.string().refine((n) => n.toLowerCase().endsWith(".csv"), {
    message: "Only .csv files are accepted",
  }),
  size: z.number().max(MAX_FILE_SIZE, "File exceeds 10MB limit"),
});

type CsvType = "activity_metrics" | "conversation_data";

function detectCsvType(headers: string[]): CsvType | null {
  const headerSet = new Set(headers.map((h) => h.trim().toLowerCase()));
  const hasAllActivityCols = ACTIVITY_METRICS_COLUMNS.every((col) =>
    headerSet.has(col.toLowerCase())
  );
  if (hasAllActivityCols) return "activity_metrics";

  const hasAllConvCols = CONVERSATION_COLUMNS.every((col) =>
    headerSet.has(col.toLowerCase())
  );
  if (hasAllConvCols) return "conversation_data";

  return null;
}

function getMissingColumns(
  headers: string[],
  required: readonly string[]
): string[] {
  const headerSet = new Set(headers.map((h) => h.trim().toLowerCase()));
  return required.filter((col) => !headerSet.has(col.toLowerCase()));
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  return lower === "true" || lower === "1" || lower === "yes";
}

function parseIntSafe(value: string | undefined): number {
  const n = parseInt(value ?? "0", 10);
  return isNaN(n) ? 0 : n;
}

function parseFloatSafe(value: string | undefined): number {
  const n = parseFloat(value ?? "0");
  return isNaN(n) ? 0 : n;
}

function parseRate(value: string | undefined): number {
  const n = parseFloatSafe(value);
  return Math.min(Math.max(n, 0), 999.99);
}

function parseTimestamp(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildActivityRow(row: Record<string, any>) {
  return {
    workspace: String(row["workspace"] ?? "").trim(),
    date: String(row["date"] ?? "").trim(),
    profile_views: parseIntSafe(row["profile_views"]),
    post_likes: parseIntSafe(row["post_likes"]),
    follows: parseIntSafe(row["follows"]),
    messages_sent: parseIntSafe(row["messages_sent"]),
    total_message_started: parseIntSafe(row["total_message_started"]),
    total_message_replies: parseIntSafe(row["total_message_replies"]),
    inmail_messages_sent: parseIntSafe(row["inmail_messages_sent"]),
    total_inmail_started: parseIntSafe(row["total_inmail_started"]),
    total_inmail_replies: parseIntSafe(row["total_inmail_replies"]),
    connections_sent: parseIntSafe(row["connections_sent"]),
    connections_accepted: parseIntSafe(row["connections_accepted"]),
    message_reply_rate: parseRate(row["message_reply_rate"]),
    inmail_reply_rate: parseRate(row["inmail_reply_rate"]),
    connection_acceptance_rate: parseRate(row["connection_acceptance_rate"]),
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildConversationRow(row: Record<string, any>) {
  return {
    workspace: String(row["workspace"] ?? "").trim(),
    conversation_id: String(row["conversation_id"] ?? "").trim(),
    read: parseBoolean(row["read"]),
    last_message_at: parseTimestamp(row["last_message_at"]),
    last_message_sender: row["last_message_sender"]
      ? String(row["last_message_sender"]).trim()
      : null,
    is_inbound_reply: parseBoolean(row["is_inbound_reply"]),
    total_messages: parseIntSafe(row["total_messages"]),
    inbound_message_count: parseIntSafe(row["inbound_message_count"]),
    outbound_message_count: parseIntSafe(row["outbound_message_count"]),
    conversation_depth_category: row["conversation_depth_category"]
      ? String(row["conversation_depth_category"]).trim()
      : null,
    lead_first_name: row["lead_first_name"]
      ? String(row["lead_first_name"]).trim()
      : null,
    lead_last_name: row["lead_last_name"]
      ? String(row["lead_last_name"]).trim()
      : null,
    lead_headline: row["lead_headline"]
      ? String(row["lead_headline"]).trim()
      : null,
    lead_position: row["lead_position"]
      ? String(row["lead_position"]).trim()
      : null,
    lead_company: row["lead_company"]
      ? String(row["lead_company"]).trim()
      : null,
    lead_location: row["lead_location"]
      ? String(row["lead_location"]).trim()
      : null,
    lead_profile_url: row["lead_profile_url"]
      ? String(row["lead_profile_url"]).trim()
      : null,
    sender_name: row["sender_name"]
      ? String(row["sender_name"]).trim()
      : null,
    sender_email: row["sender_email"]
      ? String(row["sender_email"]).trim()
      : null,
    sender_profile_url: row["sender_profile_url"]
      ? String(row["sender_profile_url"]).trim()
      : null,
    sender_account_id: row["sender_account_id"]
      ? String(row["sender_account_id"]).trim()
      : null,
    last_message_text: row["last_message_text"]
      ? String(row["last_message_text"]).trim()
      : null,
    first_outbound_message: row["first_outbound_message"]
      ? String(row["first_outbound_message"]).trim()
      : null,
    first_inbound_reply: row["first_inbound_reply"]
      ? String(row["first_inbound_reply"]).trim()
      : null,
    custom_fields: row["custom_fields"] ? { raw: row["custom_fields"] } : null,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 uploads per minute per user
  const { success: withinLimit } = rateLimit(`import:${user.id}`, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  // 2. Parse multipart form
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request — expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 3. Validate file with Zod
  const fileValidation = fileSchema.safeParse({
    name: file.name,
    size: file.size,
  });
  if (!fileValidation.success) {
    const message = fileValidation.error.issues[0]?.message ?? "Invalid file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 4. Parse CSV server-side
  const csvText = await file.text();

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const rows = parsed.data;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found in the file." },
      { status: 400 }
    );
  }

  // 5. Detect CSV type
  const csvType = detectCsvType(headers);

  if (!csvType) {
    // Try to give helpful error about which columns are missing
    const missingActivity = getMissingColumns(
      headers,
      ACTIVITY_METRICS_COLUMNS
    );
    const missingConv = getMissingColumns(headers, CONVERSATION_COLUMNS);
    const missingList =
      missingActivity.length <= missingConv.length
        ? missingActivity
        : missingConv;
    return NextResponse.json(
      {
        error: `Unrecognized CSV format. Missing required columns: ${missingList.slice(0, 5).join(", ")}${missingList.length > 5 ? ` and ${missingList.length - 5} more` : ""}.`,
      },
      { status: 400 }
    );
  }

  // 6. Validate dates for activity metrics
  if (csvType === "activity_metrics") {
    const invalidDateRows: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      const dateVal = String(rows[i]["date"] ?? "").trim();
      if (!validateDate(dateVal)) {
        invalidDateRows.push(i + 2); // +2 for 1-indexed + header row
        if (invalidDateRows.length >= 5) break;
      }
    }
    if (invalidDateRows.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid date format on row${invalidDateRows.length > 1 ? "s" : ""} ${invalidDateRows.join(", ")}. Expected YYYY-MM-DD format (e.g., 2026-01-15).`,
        },
        { status: 400 }
      );
    }
  }

  const adminClient = createAdminClient();

  // BUG-30: Clean up stale "processing" records (older than 5 min = likely crashed)
  await adminClient
    .from("upload_history")
    .update({ status: "error", error_message: "Upload interrupted — marked as failed automatically." })
    .eq("status", "processing")
    .lt("uploaded_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

  // 7. Create upload_history record with 'processing' status
  const { data: historyRecord, error: historyError } = await adminClient
    .from("upload_history")
    .insert({
      filename: file.name,
      csv_type: csvType,
      row_count: rows.length,
      rows_processed: 0,
      status: "processing",
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (historyError || !historyRecord) {
    return NextResponse.json(
      { error: "Failed to create upload record" },
      { status: 500 }
    );
  }

  const uploadId = historyRecord.id;
  let totalProcessed = 0;

  // 8. Upsert via RPC — upload_id only set on INSERT, preserved on conflict
  const rpcName =
    csvType === "activity_metrics"
      ? "safe_upsert_daily_metrics"
      : "safe_upsert_conversations";

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchRows =
      csvType === "activity_metrics"
        ? batch.map((row) => buildActivityRow(row))
        : batch.map((row) => buildConversationRow(row));

    const { error } = await adminClient.rpc(rpcName, {
      p_rows: batchRows,
      p_upload_id: uploadId,
    });

    if (error) {
      const errorDetail =
        totalProcessed > 0
          ? `Database error: ${error.message}. ${totalProcessed} of ${rows.length} rows were committed before the error.`
          : `Database error: ${error.message}`;

      await adminClient
        .from("upload_history")
        .update({
          rows_processed: totalProcessed,
          status: "error",
          error_message: errorDetail,
        })
        .eq("id", uploadId);

      return NextResponse.json({ error: errorDetail }, { status: 500 });
    }
    totalProcessed += batch.length;
  }

  // 9. Mark upload as successful with final count
  await adminClient
    .from("upload_history")
    .update({ rows_processed: totalProcessed, status: "success" })
    .eq("id", uploadId);

  // 10. Run flag evaluation after activity metrics import
  let flagResults = null;
  if (csvType === "activity_metrics") {
    try {
      flagResults = await evaluateFlags(adminClient);
    } catch {
      flagResults = { error: "Flag evaluation encountered an error" };
    }
  }

  return NextResponse.json({
    success: true,
    csvType,
    rowCount: rows.length,
    processed: totalProcessed,
    flagEvaluation: flagResults,
  });
}

// =============================================================
// DELETE /api/import — Delete an import and its associated data rows
// =============================================================

const deleteSchema = z.object({
  id: z.number().int().positive("Invalid upload ID"),
});

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // BUG-19: Rate limit deletes — 5 per minute per user
  const { success: withinLimit } = rateLimit(`delete-import:${user.id}`, {
    maxRequests: 5,
    windowMs: 60 * 1000,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many delete requests. Please wait a moment." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { id } = parsed.data;
  const adminClient = createAdminClient();

  // Look up the upload record
  const { data: upload, error: fetchError } = await adminClient
    .from("upload_history")
    .select("id, csv_type, row_count, uploaded_by")
    .eq("id", id)
    .single();

  if (fetchError || !upload) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  // BUG-20: Authorization — only the uploader or a team_lead can delete
  if (upload.uploaded_by !== user.id) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "team_lead") {
      return NextResponse.json(
        { error: "You can only delete your own imports" },
        { status: 403 }
      );
    }
  }

  // Delete associated data rows
  const table =
    upload.csv_type === "activity_metrics" ? "daily_metrics" : "conversations";

  // BUG-21: Check data deletion error before deleting the history record
  const { count: deletedRows, error: dataDeleteError } = await adminClient
    .from(table)
    .delete({ count: "exact" })
    .eq("upload_id", id);

  if (dataDeleteError) {
    return NextResponse.json(
      { error: `Failed to delete data rows: ${dataDeleteError.message}` },
      { status: 500 }
    );
  }

  // Delete the upload history record itself
  const { error: deleteError } = await adminClient
    .from("upload_history")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to delete upload record: ${deleteError.message}` },
      { status: 500 }
    );
  }

  // Re-evaluate flags after data deletion (metrics may have changed)
  if (upload.csv_type === "activity_metrics") {
    try {
      await evaluateFlags(adminClient);
    } catch {
      // Non-critical
    }
  }

  return NextResponse.json({
    success: true,
    deletedRows: deletedRows ?? 0,
  });
}
