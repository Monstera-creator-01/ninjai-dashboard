import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  AssignmentsResponse,
  WorkspaceAssignment,
} from "@/lib/types/am-summary";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all team members
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .order("full_name", { ascending: true });

    if (profilesError) {
      return NextResponse.json(
        { error: `Failed to fetch profiles: ${profilesError.message}` },
        { status: 500 }
      );
    }

    // Fetch all assignments
    const { data: assignmentRows, error: assignmentsError } = await supabase
      .from("workspace_assignments")
      .select("user_id, workspace");

    if (assignmentsError) {
      return NextResponse.json(
        { error: `Failed to fetch assignments: ${assignmentsError.message}` },
        { status: 500 }
      );
    }

    // Group assignments by user
    const assignmentsByUser: Record<string, string[]> = {};
    for (const row of assignmentRows ?? []) {
      if (!assignmentsByUser[row.user_id]) {
        assignmentsByUser[row.user_id] = [];
      }
      assignmentsByUser[row.user_id].push(row.workspace);
    }

    // Build response
    const assignments: WorkspaceAssignment[] = (profiles ?? []).map(
      (p: { id: string; full_name: string | null; email: string | null; role: string }) => ({
        userId: p.id,
        fullName: p.full_name,
        email: p.email,
        role: p.role,
        assignedWorkspaces: assignmentsByUser[p.id] ?? [],
      })
    );

    // Get available workspaces from daily_metrics
    const { data: workspaceRows } = await supabase
      .from("daily_metrics")
      .select("workspace")
      .limit(1000);

    const availableWorkspaces = [
      ...new Set((workspaceRows ?? []).map((r: { workspace: string }) => r.workspace)),
    ].sort();

    const response: AssignmentsResponse = {
      assignments,
      availableWorkspaces,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch assignments: ${message}` },
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

  // Only team leads can modify assignments
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "team_lead") {
    return NextResponse.json(
      { error: "Only team leads can manage workspace assignments" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, workspaces } = body;

    if (!userId || !Array.isArray(workspaces)) {
      return NextResponse.json(
        { error: "userId (string) and workspaces (string[]) are required" },
        { status: 400 }
      );
    }

    // Validate all workspaces are strings
    if (!workspaces.every((w: unknown) => typeof w === "string")) {
      return NextResponse.json(
        { error: "All workspaces must be strings" },
        { status: 400 }
      );
    }

    // Delete existing assignments for this user
    const { error: deleteError } = await supabase
      .from("workspace_assignments")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to update assignments: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Insert new assignments (if any)
    if (workspaces.length > 0) {
      const rows = workspaces.map((workspace: string) => ({
        user_id: userId,
        workspace,
        assigned_by: user.id,
      }));

      const { error: insertError } = await supabase
        .from("workspace_assignments")
        .insert(rows);

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to save assignments: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update assignments: ${message}` },
      { status: 500 }
    );
  }
}
