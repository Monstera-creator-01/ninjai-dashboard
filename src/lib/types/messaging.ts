// PROJ-5: Messaging Insight Summary Types

/** Reply category options for conversation tagging */
export type ReplyCategory =
  | "interested"
  | "objection"
  | "not_now"
  | "wrong_person"
  | "not_interested"
  | "referral";

export const REPLY_CATEGORIES: { value: ReplyCategory; label: string; color: string }[] = [
  { value: "interested", label: "Interested / Positive", color: "#22c55e" },
  { value: "objection", label: "Objection / Pushback", color: "#f97316" },
  { value: "not_now", label: "Not now / Timing", color: "#eab308" },
  { value: "wrong_person", label: "Wrong person / Left company", color: "#9ca3af" },
  { value: "not_interested", label: "Not interested / Rejection", color: "#ef4444" },
  { value: "referral", label: "Referral / Redirect", color: "#3b82f6" },
];

/** A conversation row with optional tag data */
export interface ConversationWithTag {
  conversation_id: string;
  workspace: string;
  last_message_at: string | null;
  last_message_sender: string | null;
  is_inbound_reply: boolean;
  total_messages: number;
  conversation_depth_category: string | null;
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_headline: string | null;
  lead_position: string | null;
  lead_company: string | null;
  lead_location: string | null;
  lead_profile_url: string | null;
  sender_name: string | null;
  sender_email: string | null;
  first_outbound_message: string | null;
  first_inbound_reply: string | null;
  last_message_text: string | null;
  custom_fields: Record<string, string> | null;
  // Tag data (from LEFT JOIN)
  tag_category: ReplyCategory | null;
  is_notable: boolean;
}

/** Filter state for the conversation browser */
export interface ConversationFilters {
  workspace: string[];
  depth: string[];
  dateFrom: string;
  dateTo: string;
  sender: string;
  replied: string; // "all" | "replied" | "not_replied"
  category: string; // "all" | ReplyCategory | "untagged"
  search: string;
  sort: string; // "date_desc" | "date_asc" | "depth_desc" | "depth_asc" | "workspace"
  page: number;
}

/** Paginated response from GET /api/conversations */
export interface ConversationsResponse {
  conversations: ConversationWithTag[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Summary stats for the reply analysis overview */
export interface ReplyAnalysisSummary {
  totalConversations: number;
  withReplies: number;
  withoutReplies: number;
  replyPercentage: number;
  depthDistribution: { category: string; count: number }[];
  topSenders: {
    senderName: string;
    workspace: string;
    totalConversations: number;
    replyCount: number;
    replyRate: number;
  }[];
}

/** Weekly summary card data */
export interface WeeklySummary {
  newReplies: number;
  categoryBreakdown: { category: ReplyCategory; label: string; count: number; color: string }[];
  untaggedCount: number;
  notableConversations: ConversationWithTag[];
}

/** Full response from GET /api/conversations/summary */
export interface ConversationsSummaryResponse {
  replyAnalysis: ReplyAnalysisSummary;
  weeklySummary: WeeklySummary;
  workspaces: string[];
  senders: string[];
}

/** Request body for PATCH /api/conversations/tags */
export interface TagUpdateRequest {
  conversationId: string;
  category?: ReplyCategory | null;
  isNotable?: boolean;
}

/** Response from PATCH /api/conversations/tags */
export interface TagUpdateResponse {
  conversationId: string;
  category: ReplyCategory | null;
  isNotable: boolean;
}
