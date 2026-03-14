/**
 * PROJ-8: Flag Evaluation Logic
 *
 * Evaluates campaign metrics against configurable thresholds
 * and generates/resolves intervention flags accordingly.
 *
 * Supported flag types (fully evaluated):
 *   - low_acceptance: acceptance rate below threshold over comparison period
 *   - low_reply: reply rate below threshold over comparison period
 *   - activity_drop: connections sent dropped > threshold% vs previous period
 *   - declining_trend: key metrics declining for N+ consecutive weeks
 *   - no_replies: zero replies despite active messaging over comparison period
 *
 * Stub flag types (disabled by default, enabled later):
 *   - sender_inactive: needs per-sender activity data (not in daily_metrics)
 *   - high_rejection: needs reply categorization data (not in daily_metrics)
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Types matching the database schema
interface FlagThresholdRow {
  id: string;
  flag_type: string;
  threshold_value: number;
  comparison_period_days: number;
  severity: string;
  enabled: boolean;
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

interface ActiveFlagRow {
  id: string;
  workspace: string;
  flag_type: string;
  status: string;
}

interface FlagEvaluationResult {
  created: number;
  updated: number;
  autoResolved: number;
  errors: string[];
}

/**
 * Runs flag evaluation for all workspaces (or a specific workspace).
 * Called after a successful CSV import.
 *
 * @param adminClient - Supabase admin client (bypasses RLS)
 * @param targetWorkspace - Optional: evaluate only this workspace
 */
export async function evaluateFlags(
  adminClient: SupabaseClient,
  targetWorkspace?: string
): Promise<FlagEvaluationResult> {
  const result: FlagEvaluationResult = {
    created: 0,
    updated: 0,
    autoResolved: 0,
    errors: [],
  };

  // 1. Load enabled thresholds
  const { data: thresholds, error: thresholdsError } = await adminClient
    .from("flag_thresholds")
    .select("id, flag_type, threshold_value, comparison_period_days, severity, enabled")
    .eq("enabled", true);

  if (thresholdsError) {
    result.errors.push(`Failed to load thresholds: ${thresholdsError.message}`);
    return result;
  }

  if (!thresholds || thresholds.length === 0) {
    return result; // No enabled thresholds, nothing to evaluate
  }

  const enabledThresholds = thresholds as FlagThresholdRow[];

  // Skip stub flag types that can't be evaluated from daily_metrics
  const STUB_FLAG_TYPES = new Set(["sender_inactive", "high_rejection"]);
  const evaluableThresholds = enabledThresholds.filter(
    (t) => !STUB_FLAG_TYPES.has(t.flag_type)
  );

  if (evaluableThresholds.length === 0) {
    return result;
  }

  // 2. Determine date ranges
  // We need up to 21 days back (for declining_trend which looks at 3 weeks)
  const now = new Date();
  const maxLookbackDays = Math.max(
    ...evaluableThresholds.map((t) => {
      // declining_trend needs 3x its period for consecutive week comparison
      if (t.flag_type === "declining_trend") return t.comparison_period_days * 2;
      // activity_drop needs current + previous period
      if (t.flag_type === "activity_drop") return t.comparison_period_days * 2;
      return t.comparison_period_days;
    })
  );

  const lookbackDate = new Date(now);
  lookbackDate.setDate(lookbackDate.getDate() - maxLookbackDays);
  const lookbackDateStr = lookbackDate.toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  // 3. Fetch daily metrics
  let metricsQuery = adminClient
    .from("daily_metrics")
    .select(
      "workspace, date, connections_sent, connections_accepted, connection_acceptance_rate, total_message_started, total_message_replies, message_reply_rate"
    )
    .gte("date", lookbackDateStr)
    .lte("date", todayStr)
    .order("date", { ascending: true });

  if (targetWorkspace) {
    metricsQuery = metricsQuery.eq("workspace", targetWorkspace);
  }

  const { data: metricsData, error: metricsError } = await metricsQuery;

  if (metricsError) {
    result.errors.push(`Failed to load metrics: ${metricsError.message}`);
    return result;
  }

  const metrics = (metricsData ?? []) as DailyMetricRow[];

  if (metrics.length === 0) {
    return result; // No metrics data at all
  }

  // 4. Group metrics by workspace
  const metricsByWorkspace: Record<string, DailyMetricRow[]> = {};
  for (const row of metrics) {
    if (!metricsByWorkspace[row.workspace]) {
      metricsByWorkspace[row.workspace] = [];
    }
    metricsByWorkspace[row.workspace].push(row);
  }

  // 5. Fetch all active/acknowledged flags
  let flagsQuery = adminClient
    .from("flags")
    .select("id, workspace, flag_type, status")
    .in("status", ["active", "acknowledged"]);

  if (targetWorkspace) {
    flagsQuery = flagsQuery.eq("workspace", targetWorkspace);
  }

  const { data: activeFlags, error: flagsError } = await flagsQuery;

  if (flagsError) {
    result.errors.push(`Failed to load active flags: ${flagsError.message}`);
    return result;
  }

  const activeFlagMap = new Map<string, ActiveFlagRow>();
  for (const flag of (activeFlags ?? []) as ActiveFlagRow[]) {
    const key = `${flag.workspace}::${flag.flag_type}`;
    activeFlagMap.set(key, flag);
  }

  // 6. Evaluate each workspace against each threshold
  for (const [workspace, wsMetrics] of Object.entries(metricsByWorkspace)) {
    for (const threshold of evaluableThresholds) {
      const { flag_type, threshold_value, comparison_period_days, severity } = threshold;
      const flagKey = `${workspace}::${flag_type}`;

      // Split metrics into current and previous periods
      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - (comparison_period_days - 1));
      const currentPeriodStartStr = currentPeriodStart.toISOString().split("T")[0];

      const prevPeriodEnd = new Date(currentPeriodStart);
      prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
      const prevPeriodStart = new Date(prevPeriodEnd);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - (comparison_period_days - 1));
      const prevPeriodStartStr = prevPeriodStart.toISOString().split("T")[0];
      const prevPeriodEndStr = prevPeriodEnd.toISOString().split("T")[0];

      const currentRows = wsMetrics.filter(
        (r) => r.date >= currentPeriodStartStr && r.date <= todayStr
      );

      // Edge case: skip if workspace has fewer than comparison_period_days of data
      if (currentRows.length < comparison_period_days) {
        continue;
      }

      const prevRows = wsMetrics.filter(
        (r) => r.date >= prevPeriodStartStr && r.date <= prevPeriodEndStr
      );

      // Evaluate the specific flag type
      const evaluation = evaluateFlagCondition(
        flag_type,
        threshold_value,
        currentRows,
        prevRows,
        wsMetrics,
        comparison_period_days
      );

      const existingFlag = activeFlagMap.get(flagKey);

      if (evaluation.triggered) {
        if (existingFlag) {
          // Flag already exists - update its timestamp and triggered value
          const { error: updateError } = await adminClient
            .from("flags")
            .update({
              triggered_value: evaluation.triggeredValue,
              threshold_value: evaluation.thresholdDisplay,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingFlag.id);

          if (updateError) {
            result.errors.push(
              `Failed to update flag for ${workspace}/${flag_type}: ${updateError.message}`
            );
          } else {
            result.updated++;
          }
        } else {
          // Create new flag
          const { error: insertError } = await adminClient
            .from("flags")
            .insert({
              workspace,
              flag_type,
              severity,
              triggered_value: evaluation.triggeredValue,
              threshold_value: evaluation.thresholdDisplay,
              status: "active",
            });

          if (insertError) {
            // Could be a unique constraint violation if there's a race condition
            if (insertError.code === "23505") {
              result.updated++;
            } else {
              result.errors.push(
                `Failed to create flag for ${workspace}/${flag_type}: ${insertError.message}`
              );
            }
          } else {
            result.created++;
          }
        }
      } else {
        // Condition NOT met - auto-resolve if an active flag exists
        if (existingFlag) {
          const { error: resolveError } = await adminClient
            .from("flags")
            .update({
              status: "resolved",
              resolved_at: new Date().toISOString(),
              resolution_type: "auto",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingFlag.id);

          if (resolveError) {
            result.errors.push(
              `Failed to auto-resolve flag for ${workspace}/${flag_type}: ${resolveError.message}`
            );
          } else {
            result.autoResolved++;
          }
        }
      }
    }
  }

  return result;
}

interface EvaluationOutcome {
  triggered: boolean;
  triggeredValue: string;
  thresholdDisplay: string;
}

function evaluateFlagCondition(
  flagType: string,
  thresholdValue: number,
  currentRows: DailyMetricRow[],
  prevRows: DailyMetricRow[],
  allRows: DailyMetricRow[],
  comparisonPeriodDays: number
): EvaluationOutcome {
  switch (flagType) {
    case "low_acceptance":
      return evaluateLowAcceptance(currentRows, thresholdValue);

    case "low_reply":
      return evaluateLowReply(currentRows, thresholdValue);

    case "activity_drop":
      return evaluateActivityDrop(currentRows, prevRows, thresholdValue);

    case "no_replies":
      return evaluateNoReplies(currentRows);

    case "declining_trend":
      return evaluateDecliningTrend(allRows, thresholdValue, comparisonPeriodDays);

    default:
      return { triggered: false, triggeredValue: "N/A", thresholdDisplay: "N/A" };
  }
}

/**
 * Low acceptance rate: average acceptance rate over the period is below threshold
 */
function evaluateLowAcceptance(
  currentRows: DailyMetricRow[],
  threshold: number
): EvaluationOutcome {
  if (currentRows.length === 0) {
    return { triggered: false, triggeredValue: "0%", thresholdDisplay: `${threshold}%` };
  }

  const avgAcceptance =
    currentRows.reduce((sum, r) => sum + (r.connection_acceptance_rate ?? 0), 0) /
    currentRows.length;

  const rounded = Math.round(avgAcceptance * 100) / 100;

  return {
    triggered: rounded < threshold,
    triggeredValue: `${rounded}%`,
    thresholdDisplay: `${threshold}%`,
  };
}

/**
 * Low reply rate: average reply rate over the period is below threshold
 */
function evaluateLowReply(
  currentRows: DailyMetricRow[],
  threshold: number
): EvaluationOutcome {
  if (currentRows.length === 0) {
    return { triggered: false, triggeredValue: "0%", thresholdDisplay: `${threshold}%` };
  }

  const avgReply =
    currentRows.reduce((sum, r) => sum + (r.message_reply_rate ?? 0), 0) /
    currentRows.length;

  const rounded = Math.round(avgReply * 100) / 100;

  return {
    triggered: rounded < threshold,
    triggeredValue: `${rounded}%`,
    thresholdDisplay: `${threshold}%`,
  };
}

/**
 * Activity drop: connections sent dropped by more than threshold% compared to previous period
 */
function evaluateActivityDrop(
  currentRows: DailyMetricRow[],
  prevRows: DailyMetricRow[],
  threshold: number
): EvaluationOutcome {
  const currentTotal = currentRows.reduce(
    (sum, r) => sum + (r.connections_sent ?? 0),
    0
  );
  const prevTotal = prevRows.reduce(
    (sum, r) => sum + (r.connections_sent ?? 0),
    0
  );

  // Can't calculate drop if previous period has no data or zero connections
  if (prevRows.length === 0 || prevTotal === 0) {
    return {
      triggered: false,
      triggeredValue: `${currentTotal} connections`,
      thresholdDisplay: `>${threshold}% drop`,
    };
  }

  const dropPercent = ((prevTotal - currentTotal) / prevTotal) * 100;
  const rounded = Math.round(dropPercent * 100) / 100;

  return {
    triggered: rounded > threshold,
    triggeredValue: `${rounded}% drop (${currentTotal} vs ${prevTotal})`,
    thresholdDisplay: `>${threshold}% drop`,
  };
}

/**
 * No replies: zero total replies over the period despite having sent messages
 */
function evaluateNoReplies(currentRows: DailyMetricRow[]): EvaluationOutcome {
  const totalReplies = currentRows.reduce(
    (sum, r) => sum + (r.total_message_replies ?? 0),
    0
  );
  const totalMessagesStarted = currentRows.reduce(
    (sum, r) => sum + (r.total_message_started ?? 0),
    0
  );

  // Only flag if there were messages sent but zero replies
  const triggered = totalReplies === 0 && totalMessagesStarted > 0;

  return {
    triggered,
    triggeredValue: `0 replies (${totalMessagesStarted} messages sent)`,
    thresholdDisplay: "0 replies with active messaging",
  };
}

/**
 * Declining trend: key metrics (acceptance rate, reply rate) declining for N+ consecutive weeks
 * threshold_value represents the number of consecutive declining weeks required (default 3)
 */
function evaluateDecliningTrend(
  allRows: DailyMetricRow[],
  consecutiveWeeksRequired: number,
  _comparisonPeriodDays: number
): EvaluationOutcome {
  // Need at least (consecutiveWeeksRequired + 1) weeks of data to compare
  const requiredWeeks = consecutiveWeeksRequired + 1;
  const requiredDays = requiredWeeks * 7;

  if (allRows.length < requiredDays) {
    return {
      triggered: false,
      triggeredValue: "Insufficient data",
      thresholdDisplay: `${consecutiveWeeksRequired} consecutive weeks declining`,
    };
  }

  // Sort rows by date ascending
  const sorted = [...allRows].sort((a, b) => a.date.localeCompare(b.date));

  // Split into weekly buckets (most recent weeks)
  const weeks: DailyMetricRow[][] = [];
  let i = sorted.length;
  while (i > 0 && weeks.length < requiredWeeks) {
    const weekEnd = i;
    const weekStart = Math.max(0, i - 7);
    weeks.unshift(sorted.slice(weekStart, weekEnd));
    i = weekStart;
  }

  if (weeks.length < requiredWeeks) {
    return {
      triggered: false,
      triggeredValue: "Insufficient data",
      thresholdDisplay: `${consecutiveWeeksRequired} consecutive weeks declining`,
    };
  }

  // Calculate weekly averages for acceptance rate and reply rate
  const weeklyAverages = weeks.map((week) => {
    const avgAcceptance =
      week.length > 0
        ? week.reduce((sum, r) => sum + (r.connection_acceptance_rate ?? 0), 0) / week.length
        : 0;
    const avgReply =
      week.length > 0
        ? week.reduce((sum, r) => sum + (r.message_reply_rate ?? 0), 0) / week.length
        : 0;
    return { avgAcceptance, avgReply };
  });

  // Check if both metrics have declined for consecutiveWeeksRequired consecutive weeks
  let acceptanceDeclineCount = 0;
  let replyDeclineCount = 0;

  for (let w = 1; w < weeklyAverages.length; w++) {
    if (weeklyAverages[w].avgAcceptance < weeklyAverages[w - 1].avgAcceptance) {
      acceptanceDeclineCount++;
    } else {
      acceptanceDeclineCount = 0;
    }

    if (weeklyAverages[w].avgReply < weeklyAverages[w - 1].avgReply) {
      replyDeclineCount++;
    } else {
      replyDeclineCount = 0;
    }
  }

  // Trigger if either metric has declined for the required number of consecutive weeks
  const triggered =
    acceptanceDeclineCount >= consecutiveWeeksRequired ||
    replyDeclineCount >= consecutiveWeeksRequired;

  const decliningMetric =
    acceptanceDeclineCount >= consecutiveWeeksRequired
      ? "acceptance rate"
      : "reply rate";

  const currentWeek = weeklyAverages[weeklyAverages.length - 1];

  return {
    triggered,
    triggeredValue: triggered
      ? `${decliningMetric} declining ${Math.max(acceptanceDeclineCount, replyDeclineCount)} weeks (current: ${Math.round(
          decliningMetric === "acceptance rate"
            ? currentWeek.avgAcceptance * 100
            : currentWeek.avgReply * 100
        ) / 100}%)`
      : "No sustained decline",
    thresholdDisplay: `${consecutiveWeeksRequired} consecutive weeks declining`,
  };
}
