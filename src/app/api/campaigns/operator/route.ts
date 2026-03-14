import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TrendDirection } from "@/lib/types/campaign";
import type {
  OperatorDashboardResponse,
  DailyActivity,
  DailyMetricComparison,
  SenderActivity,
  TimelineDataPoint,
} from "@/lib/types/operator";

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

interface ConversationRow {
  sender_name: string;
  workspace: string;
  last_message_at: string | null;
  is_inbound_reply: boolean;
}

function computeTrend(
  current: number,
  previous: number | null
): TrendDirection | null {
  if (previous === null) return null;
  if (previous === 0) return current > 0 ? "up" : "stable";
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
}

function computeChangePercent(
  current: number,
  previous: number | null
): number | null {
  if (previous === null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function buildMetricComparison(
  label: string,
  current: number,
  previous: number | null
): DailyMetricComparison {
  return {
    label,
    value: current,
    previousValue: previous,
    changePercent: computeChangePercent(current, previous),
    trend: computeTrend(current, previous),
  };
}

/**
 * Get the day of the week (0 = Sunday, 6 = Saturday) for a date string.
 */
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

/**
 * Check if a date is a weekend (Saturday or Sunday).
 */
function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return day === 0 || day === 6;
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
  const dateParam = searchParams.get("date");
  const workspaceFilter = searchParams.get("workspace");

  try {
    // Step 1: Get all available dates from daily_metrics
    let datesQuery = supabase
      .from("daily_metrics")
      .select("date")
      .order("date", { ascending: true });

    // We don't filter dates by workspace — we need all available dates for the date picker
    const { data: datesData, error: datesError } = await datesQuery;

    if (datesError) {
      return NextResponse.json(
        { error: `Failed to fetch dates: ${datesError.message}` },
        { status: 500 }
      );
    }

    if (!datesData || datesData.length === 0) {
      // No data at all
      const emptyResponse: OperatorDashboardResponse = {
        dailyActivity: {
          date: "",
          connectionsSent: buildMetricComparison("Connections Sent", 0, null),
          connectionsAccepted: buildMetricComparison("Connections Accepted", 0, null),
          acceptanceRate: buildMetricComparison("Acceptance Rate", 0, null),
          messagesStarted: buildMetricComparison("Messages Started", 0, null),
          repliesReceived: buildMetricComparison("Replies Received", 0, null),
          replyRate: buildMetricComparison("Reply Rate", 0, null),
          profileViews: buildMetricComparison("Profile Views", 0, null),
          follows: buildMetricComparison("Follows", 0, null),
        },
        senderBreakdown: [],
        timeline: [],
        availableDates: [],
        latestDate: "",
        workspaces: [],
        dataFreshness: null,
      };
      return NextResponse.json(emptyResponse);
    }

    // Build available dates list (deduplicated)
    const availableDateSet = new Set<string>();
    for (const row of datesData as { date: string }[]) {
      availableDateSet.add(row.date);
    }
    const availableDates = Array.from(availableDateSet).sort();
    const latestDate = availableDates[availableDates.length - 1];

    // Determine selected date
    const selectedDate =
      dateParam && availableDateSet.has(dateParam) ? dateParam : latestDate;

    // Compute comparison date: same weekday 7 days prior
    const selectedDateObj = new Date(selectedDate + "T00:00:00Z");
    const comparisonDateObj = new Date(selectedDateObj);
    comparisonDateObj.setUTCDate(comparisonDateObj.getUTCDate() - 7);
    const comparisonDate = comparisonDateObj.toISOString().split("T")[0];

    // Compute 30-day timeline range
    const timelineEndObj = new Date(latestDate + "T00:00:00Z");
    const timelineStartObj = new Date(timelineEndObj);
    timelineStartObj.setUTCDate(timelineStartObj.getUTCDate() - 29);
    const timelineStart = timelineStartObj.toISOString().split("T")[0];

    // Step 2: Fetch daily_metrics for selected day, comparison day, and timeline
    // We need data from the earliest of (comparisonDate, timelineStart) to the latest date
    const earliestNeeded =
      comparisonDate < timelineStart ? comparisonDate : timelineStart;

    let metricsQuery = supabase
      .from("daily_metrics")
      .select(
        "workspace, date, connections_sent, connections_accepted, connection_acceptance_rate, total_message_started, total_message_replies, message_reply_rate, profile_views, follows"
      )
      .gte("date", earliestNeeded)
      .lte("date", latestDate)
      .order("date", { ascending: true });

    if (workspaceFilter) {
      metricsQuery = metricsQuery.eq("workspace", workspaceFilter);
    }

    const { data: metricsData, error: metricsError } = await metricsQuery;

    if (metricsError) {
      return NextResponse.json(
        { error: `Failed to fetch metrics: ${metricsError.message}` },
        { status: 500 }
      );
    }

    const metrics = (metricsData ?? []) as DailyMetricRow[];

    // Step 3: Get distinct workspaces
    const workspacesSet = new Set<string>();
    for (const row of metrics) {
      workspacesSet.add(row.workspace);
    }
    const workspaces = Array.from(workspacesSet).sort();

    // Step 4: Aggregate daily activity for selected date
    const selectedDayRows = metrics.filter((r) => r.date === selectedDate);
    const comparisonDayRows = metrics.filter((r) => r.date === comparisonDate);

    const sumMetrics = (rows: DailyMetricRow[]) => ({
      connectionsSent: rows.reduce(
        (s, r) => s + (r.connections_sent ?? 0),
        0
      ),
      connectionsAccepted: rows.reduce(
        (s, r) => s + (r.connections_accepted ?? 0),
        0
      ),
      messagesStarted: rows.reduce(
        (s, r) => s + (r.total_message_started ?? 0),
        0
      ),
      repliesReceived: rows.reduce(
        (s, r) => s + (r.total_message_replies ?? 0),
        0
      ),
      profileViews: rows.reduce((s, r) => s + (r.profile_views ?? 0), 0),
      follows: rows.reduce((s, r) => s + (r.follows ?? 0), 0),
    });

    const current = sumMetrics(selectedDayRows);
    const hasComparison = comparisonDayRows.length > 0;
    const prev = hasComparison ? sumMetrics(comparisonDayRows) : null;

    const acceptanceRate =
      current.connectionsSent > 0
        ? Math.round(
            (current.connectionsAccepted / current.connectionsSent) * 100 * 10
          ) / 10
        : 0;
    const replyRate =
      current.messagesStarted > 0
        ? Math.round(
            (current.repliesReceived / current.messagesStarted) * 100 * 10
          ) / 10
        : 0;

    let prevAcceptanceRate: number | null = null;
    let prevReplyRate: number | null = null;
    if (prev) {
      prevAcceptanceRate =
        prev.connectionsSent > 0
          ? Math.round(
              (prev.connectionsAccepted / prev.connectionsSent) * 100 * 10
            ) / 10
          : 0;
      prevReplyRate =
        prev.messagesStarted > 0
          ? Math.round(
              (prev.repliesReceived / prev.messagesStarted) * 100 * 10
            ) / 10
          : 0;
    }

    const dailyActivity: DailyActivity = {
      date: selectedDate,
      connectionsSent: buildMetricComparison(
        "Connections Sent",
        current.connectionsSent,
        prev?.connectionsSent ?? null
      ),
      connectionsAccepted: buildMetricComparison(
        "Connections Accepted",
        current.connectionsAccepted,
        prev?.connectionsAccepted ?? null
      ),
      acceptanceRate: buildMetricComparison(
        "Acceptance Rate",
        acceptanceRate,
        prevAcceptanceRate
      ),
      messagesStarted: buildMetricComparison(
        "Messages Started",
        current.messagesStarted,
        prev?.messagesStarted ?? null
      ),
      repliesReceived: buildMetricComparison(
        "Replies Received",
        current.repliesReceived,
        prev?.repliesReceived ?? null
      ),
      replyRate: buildMetricComparison("Reply Rate", replyRate, prevReplyRate),
      profileViews: buildMetricComparison(
        "Profile Views",
        current.profileViews,
        prev?.profileViews ?? null
      ),
      follows: buildMetricComparison(
        "Follows",
        current.follows,
        prev?.follows ?? null
      ),
    };

    // Step 5: Build 30-day timeline
    const timelineRows = metrics.filter(
      (r) => r.date >= timelineStart && r.date <= latestDate
    );

    // Group by date and sum
    const timelineByDate: Record<
      string,
      { connectionsSent: number; repliesReceived: number }
    > = {};

    for (const row of timelineRows) {
      if (!timelineByDate[row.date]) {
        timelineByDate[row.date] = { connectionsSent: 0, repliesReceived: 0 };
      }
      timelineByDate[row.date].connectionsSent += row.connections_sent ?? 0;
      timelineByDate[row.date].repliesReceived +=
        row.total_message_replies ?? 0;
    }

    // Build timeline array for all 30 days (fill gaps with 0)
    const timeline: TimelineDataPoint[] = [];
    const cursorDate = new Date(timelineStart + "T00:00:00Z");
    const endDate = new Date(latestDate + "T00:00:00Z");

    while (cursorDate <= endDate) {
      const dateStr = cursorDate.toISOString().split("T")[0];
      const dayData = timelineByDate[dateStr];
      timeline.push({
        date: dateStr,
        connectionsSent: dayData?.connectionsSent ?? 0,
        repliesReceived: dayData?.repliesReceived ?? 0,
        isWeekend: isWeekend(dateStr),
      });
      cursorDate.setUTCDate(cursorDate.getUTCDate() + 1);
    }

    // Step 6: Fetch sender breakdown from conversations
    let convoQuery = supabase
      .from("conversations")
      .select("sender_name, workspace, last_message_at, is_inbound_reply")
      .limit(5000);

    if (workspaceFilter) {
      convoQuery = convoQuery.eq("workspace", workspaceFilter);
    }

    const { data: convoData, error: convoError } = await convoQuery;

    if (convoError) {
      console.error("Failed to fetch conversations:", convoError.message);
    }

    const conversations = (convoData ?? []) as ConversationRow[];

    // Group conversations by sender + workspace
    const senderMap: Record<
      string,
      {
        senderName: string;
        workspace: string;
        conversationCount: number;
        replyCount: number;
        lastActiveDate: string | null;
      }
    > = {};

    for (const c of conversations) {
      const senderName = c.sender_name || "Unknown";
      const key = `${c.workspace}::${senderName}`;
      if (!senderMap[key]) {
        senderMap[key] = {
          senderName,
          workspace: c.workspace,
          conversationCount: 0,
          replyCount: 0,
          lastActiveDate: null,
        };
      }
      senderMap[key].conversationCount++;
      if (c.is_inbound_reply) {
        senderMap[key].replyCount++;
      }
      if (c.last_message_at) {
        const msgDate = c.last_message_at.split("T")[0];
        if (
          !senderMap[key].lastActiveDate ||
          msgDate > senderMap[key].lastActiveDate!
        ) {
          senderMap[key].lastActiveDate = msgDate;
        }
      }
    }

    // Build sender breakdown with inactive check (7 days from latest date)
    const inactiveThresholdObj = new Date(latestDate + "T00:00:00Z");
    inactiveThresholdObj.setUTCDate(inactiveThresholdObj.getUTCDate() - 7);
    const inactiveThreshold = inactiveThresholdObj.toISOString().split("T")[0];

    const senderBreakdown: SenderActivity[] = Object.values(senderMap).map(
      (s) => ({
        ...s,
        isInactive: !s.lastActiveDate || s.lastActiveDate < inactiveThreshold,
      })
    );

    // Step 7: Fetch data freshness
    const { data: freshnessData } = await supabase
      .from("upload_history")
      .select("uploaded_at")
      .eq("status", "success")
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .single();

    const response: OperatorDashboardResponse = {
      dailyActivity,
      senderBreakdown,
      timeline,
      availableDates,
      latestDate: selectedDate,
      workspaces,
      dataFreshness: freshnessData?.uploaded_at ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to compute operator dashboard: ${message}` },
      { status: 500 }
    );
  }
}
