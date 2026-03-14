import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  WorkspaceDetailResponse,
  WorkspaceDetailRow,
  HealthStatus,
  ActivityLevel,
  TrendDirection,
  MetricWithTrend,
  WorkspaceSummary,
} from "@/lib/types/campaign";

// Health thresholds (same as snapshot route)
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

function computeTrend(current: number, previous: number | null): TrendDirection | null {
  if (previous === null || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
}

function computeActivityLevel(daysSinceLastData: number | null): ActivityLevel {
  if (daysSinceLastData === null) return "inactive";
  if (daysSinceLastData <= 7) return "active";
  if (daysSinceLastData <= 14) return "low_activity";
  return "inactive";
}

function buildMetricWithTrend(
  current: number,
  previous: number | null
): MetricWithTrend {
  return {
    current,
    previous,
    trend: computeTrend(current, previous),
  };
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
  profile_views: number;
  follows: number;
}

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
  const workspace = searchParams.get("workspace");

  if (!workspace) {
    return NextResponse.json(
      { error: "workspace parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch all data for this workspace (last 30 days for daily breakdown)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyData, error: dailyError } = await supabase
      .from("daily_metrics")
      .select(
        "workspace, date, connections_sent, connections_accepted, connection_acceptance_rate, total_message_started, total_message_replies, message_reply_rate, profile_views, follows"
      )
      .eq("workspace", workspace)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (dailyError) {
      return NextResponse.json(
        { error: `Failed to fetch data: ${dailyError.message}` },
        { status: 500 }
      );
    }

    if (!dailyData || dailyData.length === 0) {
      return NextResponse.json(
        { error: `No data found for workspace: ${workspace}` },
        { status: 404 }
      );
    }

    const rows = dailyData as DailyMetricRow[];

    // Calculate date ranges for summary
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

    const currentRows = rows.filter(
      (r) => r.date >= current7dStartStr && r.date <= today
    );
    const prevRows = rows.filter(
      (r) => r.date >= prev7dStartStr && r.date <= prev7dEndStr
    );

    // Current period aggregation
    const currentConnectionsSent = currentRows.reduce(
      (sum, r) => sum + (r.connections_sent ?? 0),
      0
    );
    const currentMessagesStarted = currentRows.reduce(
      (sum, r) => sum + (r.total_message_started ?? 0),
      0
    );
    const currentReplies = currentRows.reduce(
      (sum, r) => sum + (r.total_message_replies ?? 0),
      0
    );
    const currentAcceptanceRate =
      currentRows.length > 0
        ? currentRows.reduce((sum, r) => sum + (r.connection_acceptance_rate ?? 0), 0) /
          currentRows.length
        : 0;
    const currentReplyRate =
      currentRows.length > 0
        ? currentRows.reduce((sum, r) => sum + (r.message_reply_rate ?? 0), 0) /
          currentRows.length
        : 0;

    // Previous period
    const hasPrevData = prevRows.length > 0;
    const prevConnectionsSent = prevRows.reduce(
      (sum, r) => sum + (r.connections_sent ?? 0),
      0
    );
    const prevMessagesStarted = prevRows.reduce(
      (sum, r) => sum + (r.total_message_started ?? 0),
      0
    );
    const prevReplies = prevRows.reduce(
      (sum, r) => sum + (r.total_message_replies ?? 0),
      0
    );
    const prevAcceptanceRate = hasPrevData
      ? prevRows.reduce((sum, r) => sum + (r.connection_acceptance_rate ?? 0), 0) /
        prevRows.length
      : null;
    const prevReplyRate = hasPrevData
      ? prevRows.reduce((sum, r) => sum + (r.message_reply_rate ?? 0), 0) /
        prevRows.length
      : null;

    // Activity level
    const latestDate = rows[0]?.date;
    let daysSinceLastData: number | null = null;
    if (latestDate) {
      const latestMs = new Date(latestDate).getTime();
      const nowMs = now.getTime();
      daysSinceLastData = Math.floor((nowMs - latestMs) / (1000 * 60 * 60 * 24));
    }

    // Lifetime connections (SQL aggregation via RPC)
    const { data: lifetimeData } = await supabase.rpc(
      "get_lifetime_connections",
      { workspace_filter: workspace }
    );

    const lifetimeConnections =
      (lifetimeData as { workspace: string; total_connections: number }[] | null)?.[0]
        ?.total_connections ?? 0;

    // Data freshness
    const { data: freshnessData } = await supabase
      .from("upload_history")
      .select("uploaded_at")
      .eq("status", "success")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .single();

    const summary: WorkspaceSummary = {
      workspace,
      healthStatus: computeHealthStatus(currentAcceptanceRate, currentReplyRate),
      activityLevel: computeActivityLevel(daysSinceLastData),
      lastActiveDate: latestDate ?? null,
      connectionsSentLifetime: lifetimeConnections,
      connectionsSent7d: buildMetricWithTrend(
        currentConnectionsSent,
        hasPrevData ? prevConnectionsSent : null
      ),
      acceptanceRate7d: buildMetricWithTrend(
        Math.round(currentAcceptanceRate * 100) / 100,
        hasPrevData ? Math.round(prevAcceptanceRate! * 100) / 100 : null
      ),
      messagesStarted7d: buildMetricWithTrend(
        currentMessagesStarted,
        hasPrevData ? prevMessagesStarted : null
      ),
      replyRate7d: buildMetricWithTrend(
        Math.round(currentReplyRate * 100) / 100,
        hasPrevData ? Math.round(prevReplyRate! * 100) / 100 : null
      ),
      repliesReceived7d: buildMetricWithTrend(
        currentReplies,
        hasPrevData ? prevReplies : null
      ),
    };

    // Build daily breakdown rows
    const detailRows: WorkspaceDetailRow[] = rows.map((r) => ({
      date: r.date,
      connectionsSent: r.connections_sent ?? 0,
      connectionsAccepted: r.connections_accepted ?? 0,
      acceptanceRate: r.connection_acceptance_rate ?? 0,
      messagesStarted: r.total_message_started ?? 0,
      messageReplies: r.total_message_replies ?? 0,
      replyRate: r.message_reply_rate ?? 0,
      profileViews: r.profile_views ?? 0,
      follows: r.follows ?? 0,
    }));

    const response: WorkspaceDetailResponse = {
      workspace,
      healthStatus: summary.healthStatus,
      activityLevel: summary.activityLevel,
      summary,
      dailyData: detailRows,
      dataFreshness: freshnessData?.uploaded_at ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch workspace detail: ${message}` },
      { status: 500 }
    );
  }
}
