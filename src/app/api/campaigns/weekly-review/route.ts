import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { HealthStatus } from "@/lib/types/campaign";
import type {
  WeeklyReviewResponse,
  WorkspaceWeeklySummary,
  WeeklySummaryAggregate,
  WowChange,
  FunnelStage,
  SenderBreakdown,
} from "@/lib/types/weekly-review";
import type { Flag } from "@/lib/types/flags";

// Health thresholds (matching PROJ-3 snapshot thresholds)
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

function computeWowChange(
  current: number,
  previous: number | null
): WowChange {
  if (previous === null) {
    return { current, previous: null, changePercent: null, direction: null };
  }
  if (previous === 0) {
    return {
      current,
      previous,
      changePercent: current > 0 ? 100 : 0,
      direction: current > 0 ? "up" : "stable",
    };
  }
  const changePercent =
    Math.round(((current - previous) / previous) * 100 * 10) / 10;
  let direction: WowChange["direction"] = "stable";
  if (changePercent > 5) direction = "up";
  else if (changePercent < -5) direction = "down";

  return { current, previous, changePercent, direction };
}

/**
 * Get the Monday of the week for a given date string (YYYY-MM-DD).
 * Weeks are defined as Monday to Sunday.
 */
function getMonday(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  const day = date.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // Days since Monday
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().split("T")[0];
}

/**
 * Get the Sunday date for a given Monday start.
 */
function getSunday(mondayStr: string): string {
  const date = new Date(mondayStr + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().split("T")[0];
}

/**
 * Get previous Monday (7 days before).
 */
function getPreviousMonday(mondayStr: string): string {
  const date = new Date(mondayStr + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString().split("T")[0];
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

interface ConversationRow {
  sender_name: string;
  workspace: string;
  last_message_at: string | null;
  is_inbound_reply: boolean;
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
  const weekStartParam = searchParams.get("week_start");
  const workspaceFilter = searchParams.get("workspace");

  try {
    // Step 1: Get all distinct dates from daily_metrics to determine available weeks
    let datesQuery = supabase
      .from("daily_metrics")
      .select("date")
      .order("date", { ascending: true });

    if (workspaceFilter) {
      datesQuery = datesQuery.eq("workspace", workspaceFilter);
    }

    const { data: datesData, error: datesError } = await datesQuery;

    if (datesError) {
      return NextResponse.json(
        { error: `Failed to fetch dates: ${datesError.message}` },
        { status: 500 }
      );
    }

    if (!datesData || datesData.length === 0) {
      // No data at all
      const emptyResponse: WeeklyReviewResponse = {
        availableWeeks: [],
        selectedWeek: "",
        previousWeek: "",
        summary: {
          totalConnectionsSent: 0,
          avgAcceptanceRate: 0,
          totalMessagesStarted: 0,
          avgReplyRate: 0,
          totalReplies: 0,
          workspaceCount: 0,
        },
        workspaces: [],
      };
      return NextResponse.json(emptyResponse);
    }

    // Compute available weeks (unique Mondays)
    const mondaysSet = new Set<string>();
    for (const row of datesData as { date: string }[]) {
      mondaysSet.add(getMonday(row.date));
    }
    const availableWeeks = Array.from(mondaysSet).sort().reverse(); // Most recent first

    // Determine which week to show
    let selectedWeek: string;
    if (weekStartParam && availableWeeks.includes(weekStartParam)) {
      selectedWeek = weekStartParam;
    } else {
      // Default to most recent week
      selectedWeek = availableWeeks[0];
    }

    const previousWeek = getPreviousMonday(selectedWeek);
    const selectedSunday = getSunday(selectedWeek);
    const previousSunday = getSunday(previousWeek);

    // Step 2: Fetch daily_metrics for both weeks
    let metricsQuery = supabase
      .from("daily_metrics")
      .select(
        "workspace, date, connections_sent, connections_accepted, connection_acceptance_rate, total_message_started, total_message_replies, message_reply_rate, profile_views, follows"
      )
      .gte("date", previousWeek)
      .lte("date", selectedSunday)
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

    // Step 3: Fetch conversations for sender breakdown (current week only)
    let convoQuery = supabase
      .from("conversations")
      .select("sender_name, workspace, last_message_at, is_inbound_reply")
      .gte("last_message_at", selectedWeek + "T00:00:00Z")
      .lte("last_message_at", selectedSunday + "T23:59:59Z")
      .limit(5000);

    if (workspaceFilter) {
      convoQuery = convoQuery.eq("workspace", workspaceFilter);
    }

    const { data: convoData, error: convoError } = await convoQuery;

    if (convoError) {
      // Conversations are a nice-to-have, continue without them
      console.error("Failed to fetch conversations:", convoError.message);
    }

    const conversations = (convoData ?? []) as ConversationRow[];

    // Step 3b: Fetch all known senders per workspace (for inactive detection)
    let allSendersQuery = supabase
      .from("conversations")
      .select("sender_name, workspace")
      .limit(5000);

    if (workspaceFilter) {
      allSendersQuery = allSendersQuery.eq("workspace", workspaceFilter);
    }

    const { data: allSendersData } = await allSendersQuery;

    // Build set of all known senders per workspace
    const allSendersByWorkspace: Record<string, Set<string>> = {};
    for (const row of (allSendersData ?? []) as { sender_name: string; workspace: string }[]) {
      const name = row.sender_name || "Unknown";
      if (!allSendersByWorkspace[row.workspace]) {
        allSendersByWorkspace[row.workspace] = new Set();
      }
      allSendersByWorkspace[row.workspace].add(name);
    }

    // Step 4: Fetch active intervention flags
    let flagsQuery = supabase
      .from("intervention_flags")
      .select("*")
      .in("status", ["active", "acknowledged"])
      .order("created_at", { ascending: false });

    if (workspaceFilter) {
      flagsQuery = flagsQuery.eq("workspace", workspaceFilter);
    }

    const { data: flagsData, error: flagsError } = await flagsQuery;

    if (flagsError) {
      console.error("Failed to fetch flags:", flagsError.message);
    }

    const flags = (flagsData ?? []) as Flag[];

    // Step 5: Group metrics by workspace and period
    const workspaceCurrentData: Record<string, DailyMetricRow[]> = {};
    const workspacePrevData: Record<string, DailyMetricRow[]> = {};

    for (const row of metrics) {
      if (row.date >= selectedWeek && row.date <= selectedSunday) {
        if (!workspaceCurrentData[row.workspace]) {
          workspaceCurrentData[row.workspace] = [];
        }
        workspaceCurrentData[row.workspace].push(row);
      } else if (row.date >= previousWeek && row.date <= previousSunday) {
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

    // Step 6: Group conversations by workspace and sender
    const convoByWorkspace: Record<
      string,
      Record<
        string,
        { count: number; replyCount: number; lastActive: string | null }
      >
    > = {};

    for (const c of conversations) {
      const senderName = c.sender_name || "Unknown";
      if (!convoByWorkspace[c.workspace]) {
        convoByWorkspace[c.workspace] = {};
      }
      if (!convoByWorkspace[c.workspace][senderName]) {
        convoByWorkspace[c.workspace][senderName] = {
          count: 0,
          replyCount: 0,
          lastActive: null,
        };
      }
      convoByWorkspace[c.workspace][senderName].count++;
      if (c.is_inbound_reply) {
        convoByWorkspace[c.workspace][senderName].replyCount++;
      }
      if (
        c.last_message_at &&
        (!convoByWorkspace[c.workspace][senderName].lastActive ||
          c.last_message_at >
            convoByWorkspace[c.workspace][senderName].lastActive!)
      ) {
        convoByWorkspace[c.workspace][senderName].lastActive =
          c.last_message_at;
      }
    }

    // Step 7: Group flags by workspace
    const flagsByWorkspace: Record<string, Flag[]> = {};
    for (const flag of flags) {
      if (!flagsByWorkspace[flag.workspace]) {
        flagsByWorkspace[flag.workspace] = [];
      }
      flagsByWorkspace[flag.workspace].push(flag);
    }

    // Step 8: Build workspace summaries
    const workspaceSummaries: WorkspaceWeeklySummary[] = [];

    for (const workspace of allWorkspaces) {
      const currentRows = workspaceCurrentData[workspace] ?? [];
      const prevRows = workspacePrevData[workspace] ?? [];

      // Skip workspaces with no data in the selected week
      if (currentRows.length === 0) continue;

      // Current period aggregations
      const connSent = currentRows.reduce(
        (s, r) => s + (r.connections_sent ?? 0),
        0
      );
      const connAccepted = currentRows.reduce(
        (s, r) => s + (r.connections_accepted ?? 0),
        0
      );
      // Compute rates from totals (not averaging daily rates) for accuracy
      const acceptanceRate =
        connSent > 0 ? (connAccepted / connSent) * 100 : 0;
      const msgStarted = currentRows.reduce(
        (s, r) => s + (r.total_message_started ?? 0),
        0
      );
      const replies = currentRows.reduce(
        (s, r) => s + (r.total_message_replies ?? 0),
        0
      );
      const replyRate =
        msgStarted > 0 ? (replies / msgStarted) * 100 : 0;
      const profileViews = currentRows.reduce(
        (s, r) => s + (r.profile_views ?? 0),
        0
      );
      const followsCount = currentRows.reduce(
        (s, r) => s + (r.follows ?? 0),
        0
      );

      // Previous period aggregations
      const hasPrev = prevRows.length > 0;
      const prevConnSent = prevRows.reduce(
        (s, r) => s + (r.connections_sent ?? 0),
        0
      );
      const prevConnAccepted = prevRows.reduce(
        (s, r) => s + (r.connections_accepted ?? 0),
        0
      );
      const prevAcceptanceRate = hasPrev
        ? prevConnSent > 0
          ? (prevConnAccepted / prevConnSent) * 100
          : 0
        : null;
      const prevMsgStarted = prevRows.reduce(
        (s, r) => s + (r.total_message_started ?? 0),
        0
      );
      const prevReplies = prevRows.reduce(
        (s, r) => s + (r.total_message_replies ?? 0),
        0
      );
      const prevReplyRate = hasPrev
        ? prevMsgStarted > 0
          ? (prevReplies / prevMsgStarted) * 100
          : 0
        : null;
      const prevProfileViews = prevRows.reduce(
        (s, r) => s + (r.profile_views ?? 0),
        0
      );
      const prevFollows = prevRows.reduce(
        (s, r) => s + (r.follows ?? 0),
        0
      );

      // Build funnel
      const funnel: FunnelStage[] = [
        {
          name: "Connections Sent",
          value: connSent,
          conversionRate:
            connSent > 0
              ? Math.round((connAccepted / connSent) * 100 * 10) / 10
              : null,
        },
        {
          name: "Accepted",
          value: connAccepted,
          conversionRate:
            connAccepted > 0
              ? Math.round((msgStarted / connAccepted) * 100 * 10) / 10
              : null,
        },
        {
          name: "Messages Started",
          value: msgStarted,
          conversionRate:
            msgStarted > 0
              ? Math.round((replies / msgStarted) * 100 * 10) / 10
              : null,
        },
        {
          name: "Replies",
          value: replies,
          conversionRate: null, // Last stage
        },
      ];

      // Build sender breakdown — include inactive senders (known but no activity this week)
      const senderData = convoByWorkspace[workspace] ?? {};
      const activeSenderNames = new Set(Object.keys(senderData));
      const allKnownSenders = allSendersByWorkspace[workspace] ?? new Set<string>();

      const senders: SenderBreakdown[] = Object.entries(senderData)
        .map(([senderName, data]) => ({
          senderName,
          conversationCount: data.count,
          replyCount: data.replyCount,
          lastActiveDate: data.lastActive
            ? data.lastActive.split("T")[0]
            : null,
          isInactive: false,
        }))
        .sort((a, b) => b.conversationCount - a.conversationCount);

      // Add inactive senders (known from other weeks but not active this week)
      for (const senderName of allKnownSenders) {
        if (!activeSenderNames.has(senderName)) {
          senders.push({
            senderName,
            conversationCount: 0,
            replyCount: 0,
            lastActiveDate: null,
            isInactive: true,
          });
        }
      }

      const summary: WorkspaceWeeklySummary = {
        workspace,
        healthStatus: computeHealthStatus(
          Math.round(acceptanceRate * 100) / 100,
          Math.round(replyRate * 100) / 100
        ),
        daysWithData: currentRows.length,
        isPartialWeek: currentRows.length < 7,
        metrics: {
          connectionsSent: connSent,
          connectionsAccepted: connAccepted,
          acceptanceRate: Math.round(acceptanceRate * 100) / 100,
          messagesStarted: msgStarted,
          repliesReceived: replies,
          replyRate: Math.round(replyRate * 100) / 100,
          profileViews: profileViews,
          follows: followsCount,
        },
        wow: {
          connectionsSent: computeWowChange(
            connSent,
            hasPrev ? prevConnSent : null
          ),
          connectionsAccepted: computeWowChange(
            connAccepted,
            hasPrev ? prevConnAccepted : null
          ),
          acceptanceRate: computeWowChange(
            Math.round(acceptanceRate * 100) / 100,
            hasPrev ? Math.round(prevAcceptanceRate! * 100) / 100 : null
          ),
          messagesStarted: computeWowChange(
            msgStarted,
            hasPrev ? prevMsgStarted : null
          ),
          repliesReceived: computeWowChange(
            replies,
            hasPrev ? prevReplies : null
          ),
          replyRate: computeWowChange(
            Math.round(replyRate * 100) / 100,
            hasPrev ? Math.round(prevReplyRate! * 100) / 100 : null
          ),
          profileViews: computeWowChange(
            profileViews,
            hasPrev ? prevProfileViews : null
          ),
          follows: computeWowChange(
            followsCount,
            hasPrev ? prevFollows : null
          ),
        },
        funnel,
        senders,
        activeFlags: flagsByWorkspace[workspace] ?? [],
      };

      workspaceSummaries.push(summary);
    }

    // Sort: red first, then yellow, then green, then by name
    const healthOrder: Record<HealthStatus, number> = {
      red: 0,
      yellow: 1,
      green: 2,
    };
    workspaceSummaries.sort((a, b) => {
      const healthDiff =
        healthOrder[a.healthStatus] - healthOrder[b.healthStatus];
      if (healthDiff !== 0) return healthDiff;
      return a.workspace.localeCompare(b.workspace);
    });

    // Build aggregate summary
    const summaryAggregate: WeeklySummaryAggregate = {
      totalConnectionsSent: workspaceSummaries.reduce(
        (s, ws) => s + ws.metrics.connectionsSent,
        0
      ),
      avgAcceptanceRate:
        workspaceSummaries.length > 0
          ? Math.round(
              (workspaceSummaries.reduce(
                (s, ws) => s + ws.metrics.acceptanceRate,
                0
              ) /
                workspaceSummaries.length) *
                100
            ) / 100
          : 0,
      totalMessagesStarted: workspaceSummaries.reduce(
        (s, ws) => s + ws.metrics.messagesStarted,
        0
      ),
      avgReplyRate:
        workspaceSummaries.length > 0
          ? Math.round(
              (workspaceSummaries.reduce(
                (s, ws) => s + ws.metrics.replyRate,
                0
              ) /
                workspaceSummaries.length) *
                100
            ) / 100
          : 0,
      totalReplies: workspaceSummaries.reduce(
        (s, ws) => s + ws.metrics.repliesReceived,
        0
      ),
      workspaceCount: workspaceSummaries.length,
    };

    const response: WeeklyReviewResponse = {
      availableWeeks,
      selectedWeek,
      previousWeek,
      summary: summaryAggregate,
      workspaces: workspaceSummaries,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to compute weekly review: ${message}` },
      { status: 500 }
    );
  }
}
