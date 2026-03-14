import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// =============================================================
// GET /api/flags — List flags with filters and pagination
// =============================================================
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // active | acknowledged | resolved | null (all non-resolved)
  const severityFilter = searchParams.get("severity"); // high | medium | null
  const workspaceFilter = searchParams.get("workspace"); // workspace name | null
  const parsedPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
  const parsedPageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
  const pageSize = Math.min(50, Math.max(1, Number.isNaN(parsedPageSize) ? 10 : parsedPageSize));

  try {
    // Build main flags query
    let query = supabase
      .from("flags")
      .select("*", { count: "exact" });

    // Apply filters
    if (statusFilter === "resolved") {
      query = query.eq("status", "resolved");
    } else if (statusFilter === "active") {
      query = query.eq("status", "active");
    } else if (statusFilter === "acknowledged") {
      query = query.eq("status", "acknowledged");
    } else {
      // Default: show active + acknowledged (non-resolved)
      query = query.in("status", ["active", "acknowledged"]);
    }

    if (severityFilter === "high" || severityFilter === "medium") {
      query = query.eq("severity", severityFilter);
    }

    if (workspaceFilter) {
      query = query.eq("workspace", workspaceFilter);
    }

    // Sort: severity high first, then by created_at desc
    query = query
      .order("severity", { ascending: true }) // 'high' < 'medium' alphabetically
      .order("created_at", { ascending: false });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: flags, error: flagsError, count } = await query;

    if (flagsError) {
      return NextResponse.json(
        { error: `Failed to fetch flags: ${flagsError.message}` },
        { status: 500 }
      );
    }

    // Fetch summary counts (always unfiltered by page/severity/workspace for the summary bar)
    const { count: activeHighCount } = await supabase
      .from("flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("severity", "high");

    const { count: activeMediumCount } = await supabase
      .from("flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("severity", "medium");

    const { count: acknowledgedCount } = await supabase
      .from("flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "acknowledged");

    // Get distinct workspaces that have non-resolved flags (for filter dropdown)
    const { data: workspaceData } = await supabase
      .from("flags")
      .select("workspace")
      .in("status", ["active", "acknowledged"]);

    const workspaces = [
      ...new Set((workspaceData ?? []).map((w: { workspace: string }) => w.workspace)),
    ].sort();

    // Check if any data has been uploaded (for empty state detection)
    const { count: metricsCount } = await supabase
      .from("daily_metrics")
      .select("id", { count: "exact", head: true })
      .limit(1);

    const hasData = (metricsCount ?? 0) > 0;

    const summary = {
      activeHighCount: activeHighCount ?? 0,
      activeMediumCount: activeMediumCount ?? 0,
      acknowledgedCount: acknowledgedCount ?? 0,
      totalActiveCount: (activeHighCount ?? 0) + (activeMediumCount ?? 0),
    };

    return NextResponse.json({
      flags: flags ?? [],
      summary,
      workspaces,
      hasData,
      totalCount: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch flags: ${message}` },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/flags — Acknowledge or dismiss a flag
// =============================================================

const flagActionSchema = z.object({
  id: z.string().uuid("Invalid flag ID"),
  action: z.enum(["acknowledge", "dismiss"], {
    error: "Action must be 'acknowledge' or 'dismiss'",
  }),
  note: z.string().max(500, "Note must be 500 characters or less").nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = flagActionSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { id, action, note } = parsed.data;

  // Use admin client so we don't hit RLS issues for the update
  const adminClient = createAdminClient();

  // Verify the flag exists and is in a valid state for the action
  const { data: existingFlag, error: fetchError } = await adminClient
    .from("flags")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existingFlag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  if (action === "acknowledge") {
    if (existingFlag.status !== "active") {
      return NextResponse.json(
        { error: "Only active flags can be acknowledged" },
        { status: 400 }
      );
    }

    const { error: updateError } = await adminClient
      .from("flags")
      .update({
        status: "acknowledged",
        acknowledged_by: user.id,
        acknowledgment_note: note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to acknowledge flag: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: "acknowledged" });
  }

  if (action === "dismiss") {
    if (existingFlag.status === "resolved") {
      return NextResponse.json(
        { error: "Flag is already resolved" },
        { status: 400 }
      );
    }

    const { error: updateError } = await adminClient
      .from("flags")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_type: "manual",
        acknowledged_by: existingFlag.status === "active" ? user.id : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to dismiss flag: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: "resolved" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
