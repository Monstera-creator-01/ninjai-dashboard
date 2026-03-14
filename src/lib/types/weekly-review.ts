// PROJ-4: Weekly Campaign Health Review Types

import type { HealthStatus } from "./campaign";
import type { Flag } from "./flags";

/** A single stage in the outreach funnel */
export interface FunnelStage {
  name: string;
  value: number;
  conversionRate: number | null; // percentage to next stage, null for last stage
}

/** Sender-level activity within a workspace for a given week */
export interface SenderBreakdown {
  senderName: string;
  conversationCount: number;
  replyCount: number;
  lastActiveDate: string | null;
  isInactive: boolean;
}

/** Metrics for a single week for a workspace */
export interface WeeklyWorkspaceMetrics {
  connectionsSent: number;
  connectionsAccepted: number;
  acceptanceRate: number;
  messagesStarted: number;
  repliesReceived: number;
  replyRate: number;
  profileViews: number;
  follows: number;
}

/** Week-over-week change for a metric */
export interface WowChange {
  current: number;
  previous: number | null;
  changePercent: number | null;
  direction: "up" | "down" | "stable" | null;
}

/** Per-workspace weekly summary */
export interface WorkspaceWeeklySummary {
  workspace: string;
  healthStatus: HealthStatus;
  daysWithData: number;
  isPartialWeek: boolean;

  // Current week metrics
  metrics: WeeklyWorkspaceMetrics;

  // Week-over-week changes
  wow: {
    connectionsSent: WowChange;
    connectionsAccepted: WowChange;
    acceptanceRate: WowChange;
    messagesStarted: WowChange;
    repliesReceived: WowChange;
    replyRate: WowChange;
    profileViews: WowChange;
    follows: WowChange;
  };

  // Funnel data
  funnel: FunnelStage[];

  // Sender breakdown
  senders: SenderBreakdown[];

  // Active intervention flags for this workspace
  activeFlags: Flag[];
}

/** Aggregate summary across all workspaces for the selected week */
export interface WeeklySummaryAggregate {
  totalConnectionsSent: number;
  avgAcceptanceRate: number;
  totalMessagesStarted: number;
  avgReplyRate: number;
  totalReplies: number;
  workspaceCount: number;
}

/** Full API response for the weekly review endpoint */
export interface WeeklyReviewResponse {
  availableWeeks: string[]; // List of Monday dates (YYYY-MM-DD) that have data
  selectedWeek: string; // The week being displayed
  previousWeek: string; // The preceding week
  summary: WeeklySummaryAggregate;
  workspaces: WorkspaceWeeklySummary[];
}
