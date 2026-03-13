import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["operator", "account_manager", "team_lead"], {
    error: "Invalid role. Must be one of: operator, account_manager, team_lead",
  }),
});

export async function POST(request: NextRequest) {
  // 0. Rate limiting — 5 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: withinLimit } = rateLimit(`invite:${ip}`, {
    maxRequests: 5,
    windowMs: 60 * 1000,
  });
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // 1. Verify the requesting user is authenticated and is a team_lead
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "team_lead") {
    return NextResponse.json(
      { error: "Only team leads can invite users" },
      { status: 403 }
    );
  }

  // 2. Parse and validate the request body with Zod
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { email, role } = parsed.data;

  // 3. Invite the user via Supabase Admin API
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: { role },
    }
  );

  if (error) {
    // Handle duplicate user
    if (error.message?.includes("already been registered")) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to send invitation" },
      { status: 500 }
    );
  }

  // 4. Upsert the profile with the assigned role (in case the trigger hasn't fired yet,
  // or to update the role if the user already exists)
  if (data.user) {
    await adminClient.from("profiles").upsert(
      {
        id: data.user.id,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.json({ message: "Invitation sent successfully" });
}
