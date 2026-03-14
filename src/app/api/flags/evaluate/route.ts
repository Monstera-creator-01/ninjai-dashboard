import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { evaluateFlags } from "@/lib/flag-evaluation";

// =============================================================
// POST /api/flags/evaluate — Run flag evaluation for all workspaces
// Called after CSV import; can also be triggered manually.
// =============================================================
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 evaluations per minute per user
  const { success: withinLimit } = rateLimit(`flags-evaluate:${user.id}`, {
    maxRequests: 5,
    windowMs: 60 * 1000,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many evaluation requests. Please wait and try again." },
      { status: 429 }
    );
  }

  // Optional workspace filter from request body
  let targetWorkspace: string | undefined;
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body.workspace === "string" && body.workspace.trim()) {
      targetWorkspace = body.workspace.trim();
    }
  } catch {
    // No body or invalid JSON is fine — evaluate all workspaces
  }

  try {
    const adminClient = createAdminClient();
    const result = await evaluateFlags(adminClient, targetWorkspace);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Flag evaluation failed: ${message}` },
      { status: 500 }
    );
  }
}
