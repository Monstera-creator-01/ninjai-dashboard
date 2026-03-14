// PROJ-3: Campaign Intelligence Snapshot Types

export type HealthStatus = "green" | "yellow" | "red";
export type ActivityLevel = "active" | "low_activity" | "inactive";
export type TrendDirection = "up" | "down" | "stable";

export interface MetricWithTrend {
  current: number;
  previous: number | null;
  trend: TrendDirection | null;
}

export interface WorkspaceSummary {
  workspace: string;
  healthStatus: HealthStatus;
  activityLevel: ActivityLevel;
  lastActiveDate: string | null;

  // Core metrics
  connectionsSentLifetime: number;
  connectionsSent7d: MetricWithTrend;
  acceptanceRate7d: MetricWithTrend;
  messagesStarted7d: MetricWithTrend;
  replyRate7d: MetricWithTrend;
  repliesReceived7d: MetricWithTrend;
}

export interface SnapshotSummary {
  totalConnectionsSent7d: number;
  avgAcceptanceRate7d: number;
  totalMessagesStarted7d: number;
  avgReplyRate7d: number;
  totalRepliesReceived7d: number;
  workspaceCount: number;
}

export interface CampaignSnapshotResponse {
  summary: SnapshotSummary;
  workspaces: WorkspaceSummary[];
  dataFreshness: string | null; // ISO date string of most recent upload
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface WorkspaceDetailRow {
  date: string;
  connectionsSent: number;
  connectionsAccepted: number;
  acceptanceRate: number;
  messagesStarted: number;
  messageReplies: number;
  replyRate: number;
  profileViews: number;
  follows: number;
}

export interface WorkspaceDetailResponse {
  workspace: string;
  healthStatus: HealthStatus;
  activityLevel: ActivityLevel;
  summary: WorkspaceSummary;
  dailyData: WorkspaceDetailRow[];
  dataFreshness: string | null;
}
