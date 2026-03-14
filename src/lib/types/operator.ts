// PROJ-9: Operator Dashboard Types

import type { TrendDirection } from "./campaign";

/** A single daily metric with comparison to same weekday 7 days prior */
export interface DailyMetricComparison {
  label: string;
  value: number;
  previousValue: number | null;
  changePercent: number | null;
  trend: TrendDirection | null;
}

/** Aggregated daily activity for the selected date */
export interface DailyActivity {
  date: string;
  connectionsSent: DailyMetricComparison;
  connectionsAccepted: DailyMetricComparison;
  acceptanceRate: DailyMetricComparison;
  messagesStarted: DailyMetricComparison;
  repliesReceived: DailyMetricComparison;
  replyRate: DailyMetricComparison;
  profileViews: DailyMetricComparison;
  follows: DailyMetricComparison;
}

/** Sender activity derived from conversations table */
export interface SenderActivity {
  senderName: string;
  workspace: string;
  conversationCount: number;
  replyCount: number;
  lastActiveDate: string | null;
  isInactive: boolean;
}

/** A single day's data point for the timeline chart */
export interface TimelineDataPoint {
  date: string;
  connectionsSent: number;
  repliesReceived: number;
  isWeekend: boolean;
}

/** Full API response from GET /api/campaigns/operator */
export interface OperatorDashboardResponse {
  dailyActivity: DailyActivity;
  senderBreakdown: SenderActivity[];
  timeline: TimelineDataPoint[];
  availableDates: string[];
  latestDate: string;
  workspaces: string[];
  dataFreshness: string | null;
}
