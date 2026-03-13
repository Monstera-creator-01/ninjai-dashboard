import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Papa from "papaparse";

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

function parseTimestamp(value: string | undefined): string | null {
  if (!value || value.trim() === "") return null;
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
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
    message_reply_rate: parseFloatSafe(row["message_reply_rate"]),
    inmail_reply_rate: parseFloatSafe(row["inmail_reply_rate"]),
    connection_acceptance_rate: parseFloatSafe(
      row["connection_acceptance_rate"]
    ),
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

  // 3. File size check
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`,
      },
      { status: 400 }
    );
  }

  // 4. Parse CSV server-side
  const csvText = await file.text();

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
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

  const adminClient = createAdminClient();
  let totalInserted = 0;
  let totalUpdated = 0;

  // 6. Upsert in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    if (csvType === "activity_metrics") {
      const batchRows = batch.map(buildActivityRow);
      const { error } = await adminClient
        .from("daily_metrics")
        .upsert(batchRows, { onConflict: "workspace,date", count: "exact" });

      if (error) {
        await adminClient.from("upload_history").insert({
          filename: file.name,
          csv_type: csvType,
          row_count: rows.length,
          rows_inserted: totalInserted,
          rows_updated: totalUpdated,
          status: "error",
          error_message: error.message,
          uploaded_by: user.id,
        });
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
      // Supabase upsert doesn't return exact inserted/updated counts easily,
      // so we approximate: batch size contributed to either insert or update
      totalInserted += batch.length;
    } else {
      const batchRows = batch.map(buildConversationRow);
      const { error } = await adminClient
        .from("conversations")
        .upsert(batchRows, {
          onConflict: "conversation_id",
          count: "exact",
        });

      if (error) {
        await adminClient.from("upload_history").insert({
          filename: file.name,
          csv_type: csvType,
          row_count: rows.length,
          rows_inserted: totalInserted,
          rows_updated: totalUpdated,
          status: "error",
          error_message: error.message,
          uploaded_by: user.id,
        });
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
      totalInserted += batch.length;
    }
  }

  // 7. Log successful upload
  await adminClient.from("upload_history").insert({
    filename: file.name,
    csv_type: csvType,
    row_count: rows.length,
    rows_inserted: totalInserted,
    rows_updated: totalUpdated,
    status: "success",
    uploaded_by: user.id,
  });

  return NextResponse.json({
    success: true,
    csvType,
    rowCount: rows.length,
    inserted: totalInserted,
    updated: totalUpdated,
  });
}
