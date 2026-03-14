import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  HealthStatus,
  ActivityLevel,
  TrendDirection,
} from "@/lib/types/campaign";
import type { ReplyCategory } from "@/lib/types/messaging";
import type {
  AMWorkspaceDetailResponse,
  AMKPIData,
  AMMetric,
  AMNotableConversation,
  EmergingRisk,
  RiskSeverity,
  TalkingPointsData,
  WeekAssessment,
  WeekArchiveEntry,
} from "@/lib/types/am-summary";

// ── Shared helpers (same as snapshot) ──

const THRESHOLDS = {
  green: { acceptanceRate: 15, replyRate: 10 },
  yellow: { acceptanceRate: 8, replyRate: 5 },
};

function computeHealthStatus(acceptanceRate: number, replyRate: number): HealthStatus {
  if (acceptanceRate > THRESHOLDS.green.acceptanceRate && replyRate > THRESHOLDS.green.replyRate) return "green";
  if (acceptanceRate < THRESHOLDS.yellow.acceptanceRate || replyRate < THRESHOLDS.yellow.replyRate) return "red";
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

function buildAMMetric(current: number, previous: number | null): AMMetric {
  const trend = computeTrend(current, previous);
  let changePercent: number | null = null;
  if (previous !== null && previous !== 0) {
    changePercent = Math.round(((current - previous) / previous) * 1000) / 10;
  }
  return { current, previous, trend, changePercent };
}

/** Get the Monday of the week for a given date */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
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

// ── Risk detection ──

interface WeeklyRates {
  weekStart: string;
  replyRate: number;
  acceptanceRate: number;
}

function detectRisks(
  weeklyRates: WeeklyRates[],
  activityLevel: ActivityLevel
): EmergingRisk[] {
  const risks: EmergingRisk[] = [];

  // Sort newest first
  const sorted = [...weeklyRates].sort(
    (a, b) => b.weekStart.localeCompare(a.weekStart)
  );

  if (sorted.length === 0) return risks;

  const currentWeek = sorted[0];

  // 1. Reply Rate below critical threshold
  if (currentWeek.replyRate < 5) {
    risks.push({
      id: "reply-rate-critical",
      description: `Reply Rate bei ${currentWeek.replyRate.toFixed(1)}% — unter dem kritischen Schwellenwert von 5%`,
      severity: "critical",
      recommendedAction: "Messaging-Strategie überprüfen und A/B-Tests für neue Nachrichtenvorlagen starten",
      metricType: "replyRate",
      values: [currentWeek.replyRate.toFixed(1) + "%"],
    });
  }

  // 2. Acceptance Rate below critical threshold
  if (currentWeek.acceptanceRate < 8) {
    risks.push({
      id: "acceptance-rate-critical",
      description: `Acceptance Rate bei ${currentWeek.acceptanceRate.toFixed(1)}% — unter dem kritischen Schwellenwert von 8%`,
      severity: "critical",
      recommendedAction: "Targeting und Connection-Request-Texte überprüfen",
      metricType: "acceptanceRate",
      values: [currentWeek.acceptanceRate.toFixed(1) + "%"],
    });
  }

  // 3. Reply Rate declining 2+ consecutive weeks
  if (sorted.length >= 2) {
    let decliningWeeks = 0;
    const rateValues: string[] = [];
    for (let i = 0; i < sorted.length - 1 && i < 4; i++) {
      if (sorted[i].replyRate < sorted[i + 1].replyRate) {
        decliningWeeks++;
        if (rateValues.length === 0) {
          rateValues.push(sorted[i].replyRate.toFixed(1) + "%");
        }
        rateValues.push(sorted[i + 1].replyRate.toFixed(1) + "%");
      } else {
        break;
      }
    }
    if (decliningWeeks >= 2) {
      const severity: RiskSeverity = decliningWeeks >= 3 ? "critical" : "warning";
      const displayValues = [...rateValues].reverse();
      risks.push({
        id: "reply-rate-declining",
        description: `Reply Rate sinkt seit ${decliningWeeks + 1} Wochen: ${displayValues.join(" → ")}`,
        severity,
        recommendedAction: "Messaging überprüfen, Sender-Accounts und Zielgruppen analysieren",
        metricType: "replyRate",
        values: displayValues,
      });
    }
  }

  // 4. Acceptance Rate declining 2+ consecutive weeks
  if (sorted.length >= 2) {
    let decliningWeeks = 0;
    const rateValues: string[] = [];
    for (let i = 0; i < sorted.length - 1 && i < 4; i++) {
      if (sorted[i].acceptanceRate < sorted[i + 1].acceptanceRate) {
        decliningWeeks++;
        if (rateValues.length === 0) {
          rateValues.push(sorted[i].acceptanceRate.toFixed(1) + "%");
        }
        rateValues.push(sorted[i + 1].acceptanceRate.toFixed(1) + "%");
      } else {
        break;
      }
    }
    if (decliningWeeks >= 2) {
      const severity: RiskSeverity = decliningWeeks >= 3 ? "critical" : "warning";
      const displayValues = [...rateValues].reverse();
      risks.push({
        id: "acceptance-rate-declining",
        description: `Acceptance Rate sinkt seit ${decliningWeeks + 1} Wochen: ${displayValues.join(" → ")}`,
        severity,
        recommendedAction: "Zielgruppen-Targeting und Connection-Request-Texte überprüfen",
        metricType: "acceptanceRate",
        values: displayValues,
      });
    }
  }

  // 5. Inactivity warning
  if (activityLevel === "inactive" || activityLevel === "low_activity") {
    risks.push({
      id: "inactivity",
      description:
        activityLevel === "inactive"
          ? "Workspace ist seit über 14 Tagen inaktiv"
          : "Workspace zeigt geringe Aktivität (7-14 Tage ohne neue Daten)",
      severity: activityLevel === "inactive" ? "critical" : "warning",
      recommendedAction: "Prüfen ob Sender-Accounts aktiv sind und CSV-Daten aktuell sind",
      metricType: "activity",
    });
  }

  return risks;
}

// ── Talking points auto-generation ──

function generateTalkingPoints(
  kpis: AMKPIData,
  notableCount: number,
  risks: EmergingRisk[],
  activityLevel: ActivityLevel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notableConversations: any[]
): string {
  const points: string[] = [];

  // KPI changes
  if (kpis.replyRate.changePercent !== null) {
    const dir = kpis.replyRate.changePercent > 0 ? "stieg" : "sank";
    points.push(
      `• Reply Rate ${dir} um ${Math.abs(kpis.replyRate.changePercent).toFixed(1)}% auf ${kpis.replyRate.current.toFixed(1)}%`
    );
  }
  if (kpis.acceptanceRate.changePercent !== null) {
    const dir = kpis.acceptanceRate.changePercent > 0 ? "stieg" : "sank";
    points.push(
      `• Acceptance Rate ${dir} um ${Math.abs(kpis.acceptanceRate.changePercent).toFixed(1)}% auf ${kpis.acceptanceRate.current.toFixed(1)}%`
    );
  }
  if (kpis.connectionsSent.current > 0) {
    points.push(
      `• ${kpis.connectionsSent.current} Connections gesendet diese Woche`
    );
  }
  if (kpis.repliesReceived.current > 0) {
    points.push(
      `• ${kpis.repliesReceived.current} Replies erhalten`
    );
  }

  // Notable conversations
  if (notableCount > 0) {
    // Count by type
    const interestedCount = notableConversations.filter(
      (c) => c.tagCategory === "interested"
    ).length;
    const referralCount = notableConversations.filter(
      (c) => c.tagCategory === "referral"
    ).length;
    const parts: string[] = [];
    if (interestedCount > 0) parts.push(`${interestedCount} Interested`);
    if (referralCount > 0) parts.push(`${referralCount} Referral`);
    const othersCount = notableCount - interestedCount - referralCount;
    if (othersCount > 0) parts.push(`${othersCount} weitere bemerkenswerte`);
    points.push(`• Notable Conversations: ${parts.join(", ")}`);
  }

  // Risks
  for (const risk of risks.slice(0, 2)) {
    points.push(`• ⚠ ${risk.description}`);
  }

  // Activity
  if (activityLevel === "active") {
    points.push("• Workspace ist diese Woche aktiv");
  } else if (activityLevel === "low_activity") {
    points.push("• ⚠ Geringe Aktivität — Daten prüfen");
  }

  // Week assessment
  const assessmentLabels: Record<WeekAssessment, string> = {
    improved: "Gesamtbewertung: Verbessert ↑",
    stable: "Gesamtbewertung: Stabil →",
    declining: "Gesamtbewertung: Rückläufig ↓",
  };
  points.push(`• ${assessmentLabels[kpis.weekAssessment]}`);

  return points.join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspace: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspace } = await params;
  const decodedWorkspace = decodeURIComponent(workspace);

  if (!decodedWorkspace) {
    return NextResponse.json(
      { error: "Workspace parameter is required" },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentWeekStart = getWeekStart(now);

    // Current 7-day window
    const current7dStart = new Date(now);
    current7dStart.setDate(current7dStart.getDate() - 6);
    const current7dStartStr = current7dStart.toISOString().split("T")[0];

    // Previous 7-day window
    const prev7dEnd = new Date(current7dStart);
    prev7dEnd.setDate(prev7dEnd.getDate() - 1);
    const prev7dStart = new Date(prev7dEnd);
    prev7dStart.setDate(prev7dStart.getDate() - 6);
    const prev7dStartStr = prev7dStart.toISOString().split("T")[0];
    const prev7dEndStr = prev7dEnd.toISOString().split("T")[0];

    // 4-week lookback for risk detection
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split("T")[0];

    // Parallel queries
    const [metricsResult, riskMetricsResult, latestDatesResult, conversationsResult, talkingPointsResult] =
      await Promise.all([
        // 1. Daily metrics for current + previous 7-day window
        supabase
          .from("daily_metrics")
          .select(
            "workspace, date, connections_sent, connections_accepted, connection_acceptance_rate, total_message_started, total_message_replies, message_reply_rate"
          )
          .eq("workspace", decodedWorkspace)
          .gte("date", prev7dStartStr)
          .lte("date", today)
          .order("date", { ascending: true }),

        // 2. 4-week metrics for risk detection
        supabase
          .from("daily_metrics")
          .select("date, connection_acceptance_rate, message_reply_rate")
          .eq("workspace", decodedWorkspace)
          .gte("date", fourWeeksAgoStr)
          .lte("date", today)
          .order("date", { ascending: true }),

        // 3. Latest date for this workspace
        supabase.rpc("get_latest_dates_by_workspace", {
          workspace_filter: decodedWorkspace,
        }),

        // 4. Notable conversations (last 7 days)
        supabase
          .from("conversations")
          .select(
            `conversation_id, workspace, last_message_at, last_message_sender,
             is_inbound_reply, total_messages, conversation_depth_category,
             lead_first_name, lead_last_name, lead_headline, lead_position,
             lead_company, lead_location, lead_profile_url,
             sender_name, sender_email,
             first_outbound_message, first_inbound_reply, last_message_text,
             custom_fields,
             conversation_tags(category, is_notable)`
          )
          .eq("workspace", decodedWorkspace)
          .gte("last_message_at", current7dStartStr)
          .order("last_message_at", { ascending: false }),

        // 5. Talking points for current week
        supabase
          .from("am_talking_points")
          .select("*")
          .eq("user_id", user.id)
          .eq("workspace", decodedWorkspace)
          .eq("week_start", currentWeekStart)
          .maybeSingle(),
      ]);

    if (metricsResult.error) {
      return NextResponse.json(
        { error: `Failed to fetch metrics: ${metricsResult.error.message}` },
        { status: 500 }
      );
    }

    // ── Build KPIs ──
    const metrics = (metricsResult.data ?? []) as DailyMetricRow[];
    const currentRows = metrics.filter((r) => r.date >= current7dStartStr);
    const prevRows = metrics.filter(
      (r) => r.date >= prev7dStartStr && r.date <= prev7dEndStr
    );

    const currentConnectionsSent = currentRows.reduce((s, r) => s + (r.connections_sent ?? 0), 0);
    const currentAcceptanceRate =
      currentRows.length > 0
        ? currentRows.reduce((s, r) => s + (r.connection_acceptance_rate ?? 0), 0) / currentRows.length
        : 0;
    const currentMessagesStarted = currentRows.reduce((s, r) => s + (r.total_message_started ?? 0), 0);
    const currentReplyRate =
      currentRows.length > 0
        ? currentRows.reduce((s, r) => s + (r.message_reply_rate ?? 0), 0) / currentRows.length
        : 0;
    const currentReplies = currentRows.reduce((s, r) => s + (r.total_message_replies ?? 0), 0);

    const hasPrevData = prevRows.length > 0;
    const prevConnectionsSent = prevRows.reduce((s, r) => s + (r.connections_sent ?? 0), 0);
    const prevAcceptanceRate = hasPrevData
      ? prevRows.reduce((s, r) => s + (r.connection_acceptance_rate ?? 0), 0) / prevRows.length
      : null;
    const prevMessagesStarted = prevRows.reduce((s, r) => s + (r.total_message_started ?? 0), 0);
    const prevReplyRate = hasPrevData
      ? prevRows.reduce((s, r) => s + (r.message_reply_rate ?? 0), 0) / prevRows.length
      : null;
    const prevReplies = prevRows.reduce((s, r) => s + (r.total_message_replies ?? 0), 0);

    // Week assessment
    let improvingCount = 0;
    let decliningCount = 0;
    const kpiTrends = [
      computeTrend(currentConnectionsSent, hasPrevData ? prevConnectionsSent : null),
      computeTrend(currentAcceptanceRate, hasPrevData ? prevAcceptanceRate : null),
      computeTrend(currentReplyRate, hasPrevData ? prevReplyRate : null),
      computeTrend(currentReplies, hasPrevData ? prevReplies : null),
    ];
    for (const t of kpiTrends) {
      if (t === "up") improvingCount++;
      if (t === "down") decliningCount++;
    }
    let weekAssessment: WeekAssessment = "stable";
    if (improvingCount > decliningCount && improvingCount >= 2) weekAssessment = "improved";
    else if (decliningCount > improvingCount && decliningCount >= 2) weekAssessment = "declining";

    const kpis: AMKPIData = {
      connectionsSent: buildAMMetric(currentConnectionsSent, hasPrevData ? prevConnectionsSent : null),
      acceptanceRate: buildAMMetric(
        Math.round(currentAcceptanceRate * 100) / 100,
        hasPrevData ? Math.round(prevAcceptanceRate! * 100) / 100 : null
      ),
      messagesStarted: buildAMMetric(currentMessagesStarted, hasPrevData ? prevMessagesStarted : null),
      replyRate: buildAMMetric(
        Math.round(currentReplyRate * 100) / 100,
        hasPrevData ? Math.round(prevReplyRate! * 100) / 100 : null
      ),
      repliesReceived: buildAMMetric(currentReplies, hasPrevData ? prevReplies : null),
      weekAssessment,
    };

    // ── Activity level ──
    const latestDateData = (latestDatesResult.data ?? []) as { workspace: string; latest_date: string }[];
    const latestDate = latestDateData.length > 0 ? latestDateData[0].latest_date : null;
    let daysSinceLastData: number | null = null;
    if (latestDate) {
      daysSinceLastData = Math.floor(
        (now.getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    const activityLevel = computeActivityLevel(daysSinceLastData);

    // ── Notable conversations ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allConversations = (conversationsResult.data ?? []) as any[];
    const notableConversations: AMNotableConversation[] = [];

    for (const row of allConversations) {
      const tagArray = row.conversation_tags as
        | { category: string | null; is_notable: boolean }[]
        | null;
      const tag = Array.isArray(tagArray) && tagArray.length > 0 ? tagArray[0] : null;
      const tagCategory = (tag?.category as ReplyCategory) ?? null;
      const isNotable = tag?.is_notable ?? false;

      const qualifies =
        isNotable ||
        tagCategory === "interested" ||
        tagCategory === "referral" ||
        row.conversation_depth_category === "3+ touch";

      if (!qualifies) continue;

      const leadName = [row.lead_first_name, row.lead_last_name]
        .filter(Boolean)
        .join(" ") || "Unknown";

      const lastMessagePreview = row.last_message_text
        ? row.last_message_text.length > 100
          ? row.last_message_text.substring(0, 100) + "…"
          : row.last_message_text
        : null;

      notableConversations.push({
        conversationId: row.conversation_id,
        leadName,
        leadPosition: row.lead_position,
        leadCompany: row.lead_company,
        tagCategory,
        isNotable,
        lastMessagePreview,
        lastMessageAt: row.last_message_at,
        conversationDepthCategory: row.conversation_depth_category,
        fullConversation: {
          conversation_id: row.conversation_id,
          workspace: row.workspace,
          last_message_at: row.last_message_at,
          last_message_sender: row.last_message_sender,
          is_inbound_reply: row.is_inbound_reply,
          total_messages: row.total_messages,
          conversation_depth_category: row.conversation_depth_category,
          lead_first_name: row.lead_first_name,
          lead_last_name: row.lead_last_name,
          lead_headline: row.lead_headline,
          lead_position: row.lead_position,
          lead_company: row.lead_company,
          lead_location: row.lead_location,
          lead_profile_url: row.lead_profile_url,
          sender_name: row.sender_name,
          sender_email: row.sender_email,
          first_outbound_message: row.first_outbound_message,
          first_inbound_reply: row.first_inbound_reply,
          last_message_text: row.last_message_text,
          custom_fields: row.custom_fields as Record<string, string> | null,
          tag_category: tagCategory,
          is_notable: isNotable,
        },
      });

      if (notableConversations.length >= 10) break;
    }

    // ── Risk detection (multi-week) ──
    const riskMetrics = (riskMetricsResult.data ?? []) as {
      date: string;
      connection_acceptance_rate: number;
      message_reply_rate: number;
    }[];

    // Group by week
    const weeklyBuckets: Record<string, { replyRates: number[]; acceptanceRates: number[] }> = {};
    for (const row of riskMetrics) {
      const ws = getWeekStart(new Date(row.date));
      if (!weeklyBuckets[ws]) {
        weeklyBuckets[ws] = { replyRates: [], acceptanceRates: [] };
      }
      weeklyBuckets[ws].replyRates.push(row.message_reply_rate ?? 0);
      weeklyBuckets[ws].acceptanceRates.push(row.connection_acceptance_rate ?? 0);
    }

    const weeklyRates: WeeklyRates[] = Object.entries(weeklyBuckets)
      .map(([weekStart, data]) => ({
        weekStart,
        replyRate:
          data.replyRates.reduce((a, b) => a + b, 0) / data.replyRates.length,
        acceptanceRate:
          data.acceptanceRates.reduce((a, b) => a + b, 0) /
          data.acceptanceRates.length,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    const risks = detectRisks(weeklyRates, activityLevel);

    // ── Talking points ──
    let talkingPoints: TalkingPointsData;
    const existingTP = talkingPointsResult.data;

    if (existingTP) {
      talkingPoints = {
        autoGenerated: existingTP.auto_generated ?? "",
        userNotes: existingTP.user_notes ?? "",
        weekStart: existingTP.week_start,
        updatedAt: existingTP.updated_at,
      };
    } else {
      // Auto-generate for new week
      const autoGenerated = generateTalkingPoints(
        kpis,
        notableConversations.length,
        risks,
        activityLevel,
        notableConversations
      );

      // Save auto-generated talking points
      const { error: insertError } = await supabase
        .from("am_talking_points")
        .insert({
          user_id: user.id,
          workspace: decodedWorkspace,
          week_start: currentWeekStart,
          auto_generated: autoGenerated,
          user_notes: "",
        });

      // Ignore unique constraint violation (race condition)
      if (insertError && !insertError.message.includes("duplicate")) {
        console.error("Failed to save auto-generated talking points:", insertError);
      }

      talkingPoints = {
        autoGenerated,
        userNotes: "",
        weekStart: currentWeekStart,
        updatedAt: null,
      };
    }

    // ── Week archive ──
    const { data: archiveData } = await supabase
      .from("am_talking_points")
      .select("week_start")
      .eq("user_id", user.id)
      .eq("workspace", decodedWorkspace)
      .order("week_start", { ascending: false })
      .limit(12);

    const weekArchive: WeekArchiveEntry[] = (archiveData ?? []).map(
      (row: { week_start: string }) => {
        const ws = new Date(row.week_start);
        const weekEnd = new Date(ws);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return {
          weekStart: row.week_start,
          label: `${ws.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} - ${weekEnd.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
          isCurrent: row.week_start === currentWeekStart,
        };
      }
    );

    // Ensure current week is in the archive
    if (!weekArchive.some((w) => w.isCurrent)) {
      const ws = new Date(currentWeekStart);
      const weekEnd = new Date(ws);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekArchive.unshift({
        weekStart: currentWeekStart,
        label: `${ws.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} - ${weekEnd.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
        isCurrent: true,
      });
    }

    const response: AMWorkspaceDetailResponse = {
      workspace: decodedWorkspace,
      healthStatus: computeHealthStatus(currentAcceptanceRate, currentReplyRate),
      activityLevel,
      lastActiveDate: latestDate,
      dateRange: {
        start: current7dStartStr,
        end: today,
      },
      kpis,
      notableConversations,
      risks,
      talkingPoints,
      weekArchive,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to compute workspace detail: ${message}` },
      { status: 500 }
    );
  }
}
