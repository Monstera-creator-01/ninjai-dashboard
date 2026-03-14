import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  HealthStatus,
  ActivityLevel,
  TrendDirection,
} from "@/lib/types/campaign";
import type { AMWorkspaceCardData, AMMetric, AMSummaryResponse } from "@/lib/types/am-summary";

// Health thresholds (same as PROJ-3 snapshot)
const THRESHOLDS = {
  green: { acceptanceRate: 15, replyRate: 10 },
  yellow: { acceptanceRate: 8, replyRate: 5 },
};

function computeHealthStatus(
  acceptanceRate: number,
  replyRate: number
): HealthStatus {
  if (
    acceptanceRate > THRESHOLDS.green.acceptanceRate &&
    replyRate > THRESHOLDS.green.replyRate
  ) {
    return "green";
  }
  if (
    acceptanceRate < THRESHOLDS.yellow.acceptanceRate ||
    replyRate < THRESHOLDS.yellow.replyRate
  ) {
    return "red";
  }
  return "yellow";
}

function computeTrend(
  current: number,
  previous: number | null
): TrendDirection | null {
  if (previous === null || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
}

function computeActivityLevel(
  daysSinceLastData: number | null
): ActivityLevel {
  if (daysSinceLastData === null) return "inactive";
  if (daysSinceLastData <= 7) return "active";
  if (daysSinceLastData <= 14) return "low_activity";
  return "inactive";
}

function buildAMMetric(current: number, previous: number | null): AMMetric {
  const trend = computeTrend(current, previous);
  let changePercent: number | null = null;
  if (previous !== null && previous !== 0) {
    changePercent = Math.round(((current - previous) / previous) * 1000) / 10;
  }
  return { current, previous, trend, changePercent };
}

interface DailyMetricRow {
  workspace: string;
  date: string;
  connections_sent: number;
  connections_accepted: number;
  connection_acceptance_rate: number;
  total_message_started: number;
  total_message_replies: number;
  message_reply_rate: number;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate date ranges (rolling 7-day windows)
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const current7dStart = new Date(now);
    current7dStart.setDate(current7dStart.getDate() - 6);
    const current7dStartStr = current7dStart.toISOString().split("T")[0];

    const prev7dEnd = new Date(current7dStart);
    prev7dEnd.setDate(prev7dEnd.getDate() - 1);
    const prev7dStart = new Date(prev7dEnd);
    prev7dStart.setDate(prev7dStart.getDate() - 6);
    const prev7dStartStr = prev7dStart.toISOString().split("T")[0];
    const prev7dEndStr = prev7dEnd.toISOString().split("T")[0];

    // Parallel queries: metrics, assignments, latest dates, notable counts
    const [metricsResult, assignmentsResult, latestDatesResult, notableResult] =
      await Promise.all([
        // 1. Daily metrics (current + previous 7-day window)
        supabase
          .from("daily_metrics")
          .select(
            "workspace, date, connections_sent, connections_accepted, connection_acceptance_rate, total_message_started, total_message_replies, message_reply_rate"
          )
          .gte("date", prev7dStartStr)
          .lte("date", today)
          .order("date", { ascending: true }),

        // 2. Workspace assignments for this user
        supabase
          .from("workspace_assignments")
          .select("workspace")
          .eq("user_id", user.id),

        // 3. Latest date per workspace
        supabase.rpc("get_latest_dates_by_workspace", {}),

        // 4. Notable conversations count per workspace (last 7 days)
        supabase
          .from("conversations")
          .select(
            "workspace, conversation_id, conversation_depth_category, conversation_tags(is_notable, category)"
          )
          .gte("last_message_at", current7dStartStr),
      ]);

    if (metricsResult.error) {
      return NextResponse.json(
        { error: `Failed to fetch metrics: ${metricsResult.error.message}` },
        { status: 500 }
      );
    }

    // Build user assignments list
    const userAssignments: string[] = (assignmentsResult.data ?? []).map(
      (a: { workspace: string }) => a.workspace
    );
    const hasAssignments = userAssignments.length > 0;

    // Build latest-date lookup
    const latestDateByWorkspace: Record<string, string> = {};
    for (const row of (latestDatesResult.data ?? []) as {
      workspace: string;
      latest_date: string;
    }[]) {
      latestDateByWorkspace[row.workspace] = row.latest_date;
    }

    // Count notable conversations per workspace
    const notableCountByWorkspace: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (notableResult.data ?? []) as any[]) {
      const ws = row.workspace as string;
      const tagArray = row.conversation_tags as
        | { is_notable: boolean; category: string | null }[]
        | null;
      const tag =
        Array.isArray(tagArray) && tagArray.length > 0 ? tagArray[0] : null;
      const isNotable =
        tag?.is_notable === true ||
        tag?.category === "interested" ||
        tag?.category === "referral" ||
        row.conversation_depth_category === "3+ touch";

      if (isNotable) {
        notableCountByWorkspace[ws] = (notableCountByWorkspace[ws] ?? 0) + 1;
      }
    }

    // Split metrics into current and previous per workspace
    const metrics = (metricsResult.data ?? []) as DailyMetricRow[];
    const workspaceCurrentData: Record<string, DailyMetricRow[]> = {};
    const workspacePrevData: Record<string, DailyMetricRow[]> = {};

    for (const row of metrics) {
      if (row.date >= current7dStartStr) {
        if (!workspaceCurrentData[row.workspace]) {
          workspaceCurrentData[row.workspace] = [];
        }
        workspaceCurrentData[row.workspace].push(row);
      } else if (row.date >= prev7dStartStr && row.date <= prev7dEndStr) {
        if (!workspacePrevData[row.workspace]) {
          workspacePrevData[row.workspace] = [];
        }
        workspacePrevData[row.workspace].push(row);
      }
    }

    // Collect all workspaces
    const allWorkspaces = new Set<string>();
    for (const ws of Object.keys(workspaceCurrentData)) allWorkspaces.add(ws);
    for (const ws of Object.keys(workspacePrevData)) allWorkspaces.add(ws);
    for (const ws of Object.keys(latestDateByWorkspace)) allWorkspaces.add(ws);

    // Build workspace cards
    const workspaces: AMWorkspaceCardData[] = [];

    for (const workspace of allWorkspaces) {
      // If user has assignments, skip workspaces not assigned
      if (hasAssignments && !userAssignments.includes(workspace)) {
        continue;
      }

      const currentRows = workspaceCurrentData[workspace] ?? [];
      const prevRows = workspacePrevData[workspace] ?? [];

      // Current period
      const currentConnectionsSent = currentRows.reduce(
        (sum, r) => sum + (r.connections_sent ?? 0),
        0
      );
      const currentReplies = currentRows.reduce(
        (sum, r) => sum + (r.total_message_replies ?? 0),
        0
      );
      const currentReplyRate =
        currentRows.length > 0
          ? currentRows.reduce(
              (sum, r) => sum + (r.message_reply_rate ?? 0),
              0
            ) / currentRows.length
          : 0;
      const currentAcceptanceRate =
        currentRows.length > 0
          ? currentRows.reduce(
              (sum, r) => sum + (r.connection_acceptance_rate ?? 0),
              0
            ) / currentRows.length
          : 0;

      // Previous period
      const hasPrevData = prevRows.length > 0;
      const prevConnectionsSent = prevRows.reduce(
        (sum, r) => sum + (r.connections_sent ?? 0),
        0
      );
      const prevReplies = prevRows.reduce(
        (sum, r) => sum + (r.total_message_replies ?? 0),
        0
      );
      const prevReplyRate = hasPrevData
        ? prevRows.reduce((sum, r) => sum + (r.message_reply_rate ?? 0), 0) /
          prevRows.length
        : null;

      // Activity level
      const latestDate = latestDateByWorkspace[workspace];
      let daysSinceLastData: number | null = null;
      if (latestDate) {
        const latestMs = new Date(latestDate).getTime();
        daysSinceLastData = Math.floor(
          (now.getTime() - latestMs) / (1000 * 60 * 60 * 24)
        );
      }

      // Risk count: simple check for red-threshold metrics or inactivity
      let riskCount = 0;
      if (currentReplyRate < 5 && currentRows.length > 0) riskCount++;
      if (currentAcceptanceRate < 8 && currentRows.length > 0) riskCount++;
      const activityLevel = computeActivityLevel(daysSinceLastData);
      if (
        activityLevel === "inactive" ||
        activityLevel === "low_activity"
      ) {
        riskCount++;
      }

      const card: AMWorkspaceCardData = {
        workspace,
        healthStatus: computeHealthStatus(
          currentAcceptanceRate,
          currentReplyRate
        ),
        activityLevel,
        lastActiveDate: latestDate ?? null,
        connectionsSent7d: buildAMMetric(
          currentConnectionsSent,
          hasPrevData ? prevConnectionsSent : null
        ),
        replyRate7d: buildAMMetric(
          Math.round(currentReplyRate * 100) / 100,
          hasPrevData ? Math.round(prevReplyRate! * 100) / 100 : null
        ),
        repliesReceived7d: buildAMMetric(
          currentReplies,
          hasPrevData ? prevReplies : null
        ),
        notableConversationsCount: notableCountByWorkspace[workspace] ?? 0,
        riskCount,
      };

      workspaces.push(card);
    }

    // Sort: active first, then by name
    const activityOrder: Record<ActivityLevel, number> = {
      active: 0,
      low_activity: 1,
      inactive: 2,
    };
    workspaces.sort((a, b) => {
      const actDiff =
        activityOrder[a.activityLevel] - activityOrder[b.activityLevel];
      if (actDiff !== 0) return actDiff;
      return a.workspace.localeCompare(b.workspace);
    });

    const response: AMSummaryResponse = {
      workspaces,
      userAssignments,
      hasAssignments,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to compute AM summary: ${message}` },
      { status: 500 }
    );
  }
}
