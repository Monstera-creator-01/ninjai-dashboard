import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// =============================================================
// GET /api/flags/thresholds — Get all threshold configurations
// =============================================================
export async function GET() {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: thresholds, error } = await supabase
      .from("flag_thresholds")
      .select("*")
      .order("severity", { ascending: true }) // high first
      .order("flag_type", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch thresholds: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ thresholds: thresholds ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch thresholds: ${message}` },
      { status: 500 }
    );
  }
}

// =============================================================
// PATCH /api/flags/thresholds — Update a threshold (team_lead only)
// =============================================================

const updateThresholdSchema = z.object({
  id: z.string().uuid("Invalid threshold ID"),
  threshold_value: z
    .number()
    .min(0, "Threshold must be 0 or greater")
    .max(999, "Threshold must be 999 or less")
    .optional(),
  enabled: z.boolean().optional(),
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

  // Role check: only team_lead can update thresholds
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "team_lead") {
    return NextResponse.json(
      { error: "Only team leads can update threshold settings" },
      { status: 403 }
    );
  }

  // Parse and validate body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateThresholdSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { id, threshold_value, enabled } = parsed.data;

  // Must have at least one field to update
  if (threshold_value === undefined && enabled === undefined) {
    return NextResponse.json(
      { error: "At least one of threshold_value or enabled must be provided" },
      { status: 400 }
    );
  }

  // Use admin client to bypass the RLS check (we already verified role above)
  const adminClient = createAdminClient();

  // Verify the threshold exists
  const { data: existing, error: fetchError } = await adminClient
    .from("flag_thresholds")
    .select("id, flag_type")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Threshold not found" }, { status: 404 });
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  if (threshold_value !== undefined) {
    updatePayload.threshold_value = threshold_value;
  }

  if (enabled !== undefined) {
    updatePayload.enabled = enabled;
  }

  const { error: updateError } = await adminClient
    .from("flag_thresholds")
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update threshold: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
