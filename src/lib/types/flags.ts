// PROJ-8: Campaign Intervention Flag System Types

export type FlagType =
  | "low_acceptance"
  | "low_reply"
  | "activity_drop"
  | "sender_inactive"
  | "high_rejection"
  | "declining_trend"
  | "no_replies";

export type FlagSeverity = "high" | "medium";

export type FlagStatus = "active" | "acknowledged" | "resolved";

export type ResolutionType = "auto" | "manual";

export interface Flag {
  id: string;
  workspace: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  triggered_value: string; // e.g., "3.2%"
  threshold_value: string; // e.g., "8%"
  status: FlagStatus;
  acknowledged_by: string | null;
  acknowledgment_note: string | null;
  resolved_at: string | null;
  resolution_type: ResolutionType | null;
  created_at: string;
  updated_at: string;
}

export interface FlagThreshold {
  id: string;
  flag_type: FlagType;
  display_name: string;
  description: string;
  threshold_value: number;
  comparison_period_days: number;
  severity: FlagSeverity;
  enabled: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface FlagFilters {
  status: FlagStatus | "all";
  severity: FlagSeverity | "all";
  workspace: string;
}

export interface FlagSummary {
  activeHighCount: number;
  activeMediumCount: number;
  acknowledgedCount: number;
  totalActiveCount: number;
}

export interface FlagsResponse {
  flags: Flag[];
  summary: FlagSummary;
  workspaces: string[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FlagCountResponse {
  count: number;
}

export interface FlagThresholdsResponse {
  thresholds: FlagThreshold[];
}

// Human-readable labels for flag types
export const FLAG_TYPE_LABELS: Record<FlagType, string> = {
  low_acceptance: "Low Connection Acceptance",
  low_reply: "Low Reply Rate",
  activity_drop: "Activity Drop",
  sender_inactive: "Sender Inactive",
  high_rejection: "High Rejection Pattern",
  declining_trend: "Declining Trend",
  no_replies: "No Replies",
};

// Human-readable descriptions for flag types
export const FLAG_TYPE_DESCRIPTIONS: Record<FlagType, string> = {
  low_acceptance: "Connection acceptance rate below threshold over the comparison period",
  low_reply: "Reply rate below threshold over the comparison period",
  activity_drop: "Connections sent dropped significantly compared to previous period",
  sender_inactive: "A sender account has had zero activity for 3+ weekdays",
  high_rejection: "High percentage of replies tagged as 'Not interested' or 'Wrong person'",
  declining_trend: "Key metrics declining for 3+ consecutive weeks",
  no_replies: "Zero inbound replies over the comparison period despite active messaging",
};
