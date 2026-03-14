import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { TalkingPointsUpdateResponse } from "@/lib/types/am-summary";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get("workspace");
  const week = searchParams.get("week");

  if (!workspace || !week) {
    return NextResponse.json(
      { error: "workspace and week parameters are required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("am_talking_points")
      .select("*")
      .eq("user_id", user.id)
      .eq("workspace", workspace)
      .eq("week_start", week)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch talking points: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        auto_generated: "",
        user_notes: "",
        week_start: week,
        updated_at: null,
      });
    }

    return NextResponse.json({
      auto_generated: data.auto_generated ?? "",
      user_notes: data.user_notes ?? "",
      week_start: data.week_start,
      updated_at: data.updated_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch talking points: ${message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: 30 requests per minute (auto-save with debounce)
  const rateLimitResult = rateLimit(`talking-points:${user.id}`, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { workspace, weekStart, userNotes } = body;

    if (!workspace || !weekStart) {
      return NextResponse.json(
        { error: "workspace and weekStart are required" },
        { status: 400 }
      );
    }

    if (typeof userNotes !== "string") {
      return NextResponse.json(
        { error: "userNotes must be a string" },
        { status: 400 }
      );
    }

    // Upsert talking points (insert or update)
    const { data, error } = await supabase
      .from("am_talking_points")
      .upsert(
        {
          user_id: user.id,
          workspace,
          week_start: weekStart,
          user_notes: userNotes,
        },
        {
          onConflict: "user_id,workspace,week_start",
        }
      )
      .select("updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to save talking points: ${error.message}` },
        { status: 500 }
      );
    }

    const response: TalkingPointsUpdateResponse = {
      success: true,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save talking points: ${message}` },
      { status: 500 }
    );
  }
}
