import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================================
// GET /api/flags/count — Active flag count for sidebar badge
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
    const { count, error } = await supabase
      .from("flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch flag count: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch flag count: ${message}` },
      { status: 500 }
    );
  }
}
