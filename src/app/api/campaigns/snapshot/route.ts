import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  CampaignSnapshotResponse,
  WorkspaceSummary,
  SnapshotSummary,
  HealthStatus,
  ActivityLevel,
  TrendDirection,
  MetricWithTrend,
} from "@/lib/types/campaign";

// Health thresholds (configurable)
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

function computeActivityLevel(
  daysSinceLastData: number | null
): ActivityLevel {
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

  // Parse optional workspace filter from query params
  const { searchParams } = new URL(request.url);
  const workspaceFilter = searchParams.get("workspace");

  // Calculate date ranges
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Current 7-day window
  const current7dEnd = new Date(now);
  const current7dStart = new Date(now);
  current7dStart.setDate(current7dStart.getDate() - 6);

  // Previous 7-day window
  const prev7dEnd = new Date(current7dStart);
  prev7dEnd.setDate(prev7dEnd.getDate() - 1);
  const prev7dStart = new Date(prev7dEnd);
  prev7dStart.setDate(prev7dStart.getDate() - 6);

  const current7dStartStr = current7dStart.toISOString().split("T")[0];
  const prev7dStartStr = prev7dStart.toISOString().split("T")[0];
  const prev7dEndStr = prev7dEnd.toISOString().split("T")[0];

  try {
    // Fetch all daily metrics (we need both current and previous periods)
    let query = supabase
      .from("daily_metrics")
      .select(
        "workspace, date, connections_sent, connections_accepted, connection_acceptance_rate, total_message_started, total_message_replies, message_reply_rate"
      )
      .gte("date", prev7dStartStr)
      .lte("date", today)
      .order("date", { ascending: true });

    if (workspaceFilter) {
      query = query.eq("workspace", workspaceFilter);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      return NextResponse.json(
        { error: `Failed to fetch metrics: ${metricsError.message}` },
        { status: 500 }
      );
    }

    // Fetch lifetime connections per workspace (SQL aggregation via RPC)
    const { data: lifetimeData, error: lifetimeError } = await supabase.rpc(
      "get_lifetime_connections",
      workspaceFilter ? { workspace_filter: workspaceFilter } : {}
    );

    if (lifetimeError) {
      return NextResponse.json(
        { error: `Failed to fetch lifetime data: ${lifetimeError.message}` },
        { status: 500 }
      );
    }

    // Fetch data freshness from upload_history
    const { data: freshnessData } = await supabase
      .from("upload_history")
      .select("uploaded_at")
      .eq("status", "success")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .single();

    // Get the latest date per workspace (SQL aggregation via RPC)
    const { data: latestDatesData } = await supabase.rpc(
      "get_latest_dates_by_workspace",
      workspaceFilter ? { workspace_filter: workspaceFilter } : {}
    );

    const latestDateByWorkspace: Record<string, string> = {};
    for (const row of (latestDatesData ?? []) as { workspace: string; latest_date: string }[]) {
      latestDateByWorkspace[row.workspace] = row.latest_date;
    }

    // Group metrics by workspace
    const metrics = (metricsData ?? []) as DailyMetricRow[];

    // Build lifetime connections lookup (already aggregated by SQL)
    const lifetimeConnectionsByWorkspace: Record<string, number> = {};
    for (const row of (lifetimeData ?? []) as { workspace: string; total_connections: number }[]) {
      lifetimeConnectionsByWorkspace[row.workspace] = row.total_connections;
    }

    // Split into current and previous period per workspace
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

    // Build all workspaces set
    const allWorkspaces = new Set<string>();
    for (const ws of Object.keys(workspaceCurrentData)) allWorkspaces.add(ws);
    for (const ws of Object.keys(workspacePrevData)) allWorkspaces.add(ws);
    for (const ws of Object.keys(lifetimeConnectionsByWorkspace)) allWorkspaces.add(ws);

    // Build workspace summaries
    const workspaceSummaries: WorkspaceSummary[] = [];

    for (const workspace of allWorkspaces) {
      const currentRows = workspaceCurrentData[workspace] ?? [];
      const prevRows = workspacePrevData[workspace] ?? [];

      // Current period sums
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

      // Previous period sums
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
      const latestDate = latestDateByWorkspace[workspace];
      let daysSinceLastData: number | null = null;
      if (latestDate) {
        const latestMs = new Date(latestDate).getTime();
        const nowMs = now.getTime();
        daysSinceLastData = Math.floor((nowMs - latestMs) / (1000 * 60 * 60 * 24));
      }

      const summary: WorkspaceSummary = {
        workspace,
        healthStatus: computeHealthStatus(currentAcceptanceRate, currentReplyRate),
        activityLevel: computeActivityLevel(daysSinceLastData),
        lastActiveDate: latestDate ?? null,
        connectionsSentLifetime: lifetimeConnectionsByWorkspace[workspace] ?? 0,
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

      workspaceSummaries.push(summary);
    }

    // Sort workspaces: active first, then by name
    workspaceSummaries.sort((a, b) => {
      const activityOrder: Record<ActivityLevel, number> = {
        active: 0,
        low_activity: 1,
        inactive: 2,
      };
      const actDiff = activityOrder[a.activityLevel] - activityOrder[b.activityLevel];
      if (actDiff !== 0) return actDiff;
      return a.workspace.localeCompare(b.workspace);
    });

    // Build overall summary
    const summaryData: SnapshotSummary = {
      totalConnectionsSent7d: workspaceSummaries.reduce(
        (sum, ws) => sum + ws.connectionsSent7d.current,
        0
      ),
      avgAcceptanceRate7d:
        workspaceSummaries.length > 0
          ? Math.round(
              (workspaceSummaries.reduce(
                (sum, ws) => sum + ws.acceptanceRate7d.current,
                0
              ) /
                workspaceSummaries.length) *
                100
            ) / 100
          : 0,
      totalMessagesStarted7d: workspaceSummaries.reduce(
        (sum, ws) => sum + ws.messagesStarted7d.current,
        0
      ),
      avgReplyRate7d:
        workspaceSummaries.length > 0
          ? Math.round(
              (workspaceSummaries.reduce(
                (sum, ws) => sum + ws.replyRate7d.current,
                0
              ) /
                workspaceSummaries.length) *
                100
            ) / 100
          : 0,
      totalRepliesReceived7d: workspaceSummaries.reduce(
        (sum, ws) => sum + ws.repliesReceived7d.current,
        0
      ),
      workspaceCount: workspaceSummaries.length,
    };

    // Find date range from metrics
    let dateStart: string | null = null;
    let dateEnd: string | null = null;
    if (metrics.length > 0) {
      dateStart = metrics[0].date;
      dateEnd = metrics[metrics.length - 1].date;
    }

    const response: CampaignSnapshotResponse = {
      summary: summaryData,
      workspaces: workspaceSummaries,
      dataFreshness: freshnessData?.uploaded_at ?? null,
      dateRange: {
        start: dateStart,
        end: dateEnd,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to compute snapshot: ${message}` },
      { status: 500 }
    );
  }
}
