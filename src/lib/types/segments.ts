// PROJ-6: Segment Comparison Analysis Types

/** Available comparison dimensions */
export type SegmentDimension = "workspace" | "sender" | "position" | "category";

export const SEGMENT_DIMENSIONS: { value: SegmentDimension; label: string }[] = [
  { value: "workspace", label: "Workspace" },
  { value: "sender", label: "Sender Account" },
  { value: "position", label: "Lead Position" },
  { value: "category", label: "Reply Category" },
];

/** Available chart metrics */
export type SegmentMetric = "replyRate" | "conversationCount" | "avgDepth";

export const SEGMENT_METRICS: { value: SegmentMetric; label: string }[] = [
  { value: "replyRate", label: "Reply Rate (%)" },
  { value: "conversationCount", label: "Conversation Count" },
  { value: "avgDepth", label: "Avg. Depth" },
];

/** Date preset options */
export type DatePreset = "7d" | "30d" | "90d" | "all" | "custom";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "7d", label: "7 Tage" },
  { value: "30d", label: "30 Tage" },
  { value: "90d", label: "90 Tage" },
  { value: "all", label: "Gesamt" },
  { value: "custom", label: "Benutzerdefiniert" },
];

/** Category breakdown item within a segment */
export interface CategoryBreakdownItem {
  category: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/** Depth distribution item */
export interface DepthDistributionItem {
  category: string;
  count: number;
}

/** Top sender within a segment */
export interface SegmentTopSender {
  senderName: string;
  conversationCount: number;
  replyRate: number;
}

/** A single segment row in the comparison */
export interface SegmentData {
  /** The dimension value (e.g. workspace name, sender name, position) */
  segmentValue: string;
  /** Total conversations in this segment */
  conversationCount: number;
  /** Reply rate as percentage (0-100) */
  replyRate: number;
  /** Average total_messages per conversation */
  avgDepth: number;
  /** Most common reply category (or null if no tags) */
  topCategory: string | null;
  /** Distribution of reply categories */
  categoryBreakdown: CategoryBreakdownItem[];
  /** Depth distribution (1-touch, 2-touch, 3+) */
  depthDistribution: DepthDistributionItem[];
  /** Top 3 senders by reply rate (only populated when dimension != "sender") */
  topSenders: SegmentTopSender[];
  /** Whether this segment has a small sample size (< 5 conversations) */
  isSmallSample: boolean;
}

/** Response from GET /api/campaigns/segments */
export interface SegmentComparisonResponse {
  segments: SegmentData[];
  totalSegments: number;
  dimension: SegmentDimension;
  dateFrom: string | null;
  dateTo: string | null;
  /** Whether the database has any conversations at all (ignoring date filters) */
  hasAnyConversations: boolean;
}

/** Filter state for the segment comparison page */
export interface SegmentFilters {
  dimension: SegmentDimension;
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
}
