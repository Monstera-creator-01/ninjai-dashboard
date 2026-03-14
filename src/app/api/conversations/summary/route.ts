import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REPLY_CATEGORIES } from "@/lib/types/messaging";
import type {
  ConversationsSummaryResponse,
  ReplyAnalysisSummary,
  WeeklySummary,
  ReplyCategory,
  ConversationWithTag,
} from "@/lib/types/messaging";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceParam = searchParams.get("workspace");
  const depthParam = searchParams.get("depth");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const senderParam = searchParams.get("sender");
  const repliedParam = searchParams.get("replied");
  const searchParam = searchParams.get("search");

  try {
    // Fetch all conversations with tags for summary computation
    let query = supabase
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
      .limit(5000);

    // Apply same filters as the main conversations endpoint
    if (workspaceParam) {
      const workspaces = workspaceParam.split(",").filter(Boolean);
      if (workspaces.length > 0) {
        query = query.in("workspace", workspaces);
      }
    }

    if (depthParam) {
      const depths = depthParam.split(",").filter(Boolean);
      if (depths.length > 0) {
        query = query.in("conversation_depth_category", depths);
      }
    }

    if (dateFrom) {
      query = query.gte("last_message_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("last_message_at", dateTo + "T23:59:59.999Z");
    }

    if (senderParam) {
      query = query.eq("sender_name", senderParam);
    }

    if (repliedParam === "replied") {
      query = query.eq("is_inbound_reply", true);
    } else if (repliedParam === "not_replied") {
      query = query.eq("is_inbound_reply", false);
    }

    if (searchParam && searchParam.length >= 2) {
      // Escape ILIKE special characters (% and _)
      const escaped = searchParam.replace(/[%_\\]/g, "\\$&");
      const searchTerm = `%${escaped}%`;
      query = query.or(
        `first_outbound_message.ilike.${searchTerm},first_inbound_reply.ilike.${searchTerm},last_message_text.ilike.${searchTerm},lead_first_name.ilike.${searchTerm},lead_last_name.ilike.${searchTerm},lead_company.ilike.${searchTerm}`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch conversations: ${error.message}` },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    // Transform rows
    const conversations = rows.map((row) => {
      const tagArray = row.conversation_tags as
        | { category: string | null; is_notable: boolean }[]
        | null;
      const tag = Array.isArray(tagArray) && tagArray.length > 0 ? tagArray[0] : null;

      return {
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
        tag_category: (tag?.category as ReplyCategory) ?? null,
        is_notable: tag?.is_notable ?? false,
      } satisfies ConversationWithTag;
    });

    // --- Reply Analysis Summary (AC-2) ---
    const totalConversations = conversations.length;
    const withReplies = conversations.filter((c) => c.is_inbound_reply).length;
    const withoutReplies = totalConversations - withReplies;
    const replyPercentage =
      totalConversations > 0
        ? Math.round((withReplies / totalConversations) * 100 * 10) / 10
        : 0;

    // Depth distribution
    const depthCounts: Record<string, number> = {};
    for (const c of conversations) {
      const cat = c.conversation_depth_category || "unknown";
      depthCounts[cat] = (depthCounts[cat] || 0) + 1;
    }
    const depthDistribution = Object.entries(depthCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Top 5 senders by reply rate
    const senderStats: Record<
      string,
      { senderName: string; workspace: string; total: number; replies: number }
    > = {};
    for (const c of conversations) {
      const name = c.sender_name || "Unknown";
      const key = `${c.workspace}::${name}`;
      if (!senderStats[key]) {
        senderStats[key] = { senderName: name, workspace: c.workspace, total: 0, replies: 0 };
      }
      senderStats[key].total++;
      if (c.is_inbound_reply) senderStats[key].replies++;
    }
    const topSenders = Object.values(senderStats)
      .filter((s) => s.total >= 5) // minimum threshold for meaningful rate
      .map((s) => ({
        senderName: s.senderName,
        workspace: s.workspace,
        totalConversations: s.total,
        replyCount: s.replies,
        replyRate: Math.round((s.replies / s.total) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.replyRate - a.replyRate)
      .slice(0, 5);

    const replyAnalysis: ReplyAnalysisSummary = {
      totalConversations,
      withReplies,
      withoutReplies,
      replyPercentage,
      depthDistribution,
      topSenders,
    };

    // --- Weekly Summary (AC-5) ---
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    const weeklyConversations = conversations.filter(
      (c) => c.last_message_at && c.last_message_at >= sevenDaysAgoStr
    );

    const newReplies = weeklyConversations.filter((c) => c.is_inbound_reply).length;

    // Category breakdown (only tagged)
    const categoryCounts: Record<string, number> = {};
    for (const c of weeklyConversations) {
      if (c.tag_category) {
        categoryCounts[c.tag_category] = (categoryCounts[c.tag_category] || 0) + 1;
      }
    }
    const categoryBreakdown = REPLY_CATEGORIES
      .map((cat) => ({
        category: cat.value,
        label: cat.label,
        count: categoryCounts[cat.value] || 0,
        color: cat.color,
      }))
      .filter((c) => c.count > 0);

    const untaggedCount = weeklyConversations.filter(
      (c) => c.is_inbound_reply && !c.tag_category
    ).length;

    // Notable conversations (3+ touch OR manually flagged) — scoped to last 7 days
    const notableConversations = weeklyConversations
      .filter(
        (c) =>
          c.is_notable ||
          c.conversation_depth_category === "3+ touch"
      )
      .sort((a, b) => {
        const dateA = a.last_message_at || "";
        const dateB = b.last_message_at || "";
        return dateB.localeCompare(dateA);
      })
      .slice(0, 10);

    const weeklySummary: WeeklySummary = {
      newReplies,
      categoryBreakdown,
      untaggedCount,
      notableConversations,
    };

    // --- Distinct values for filters ---
    const workspacesSet = new Set<string>();
    const sendersSet = new Set<string>();
    for (const c of conversations) {
      workspacesSet.add(c.workspace);
      if (c.sender_name) sendersSet.add(c.sender_name);
    }

    const response: ConversationsSummaryResponse = {
      replyAnalysis,
      weeklySummary,
      workspaces: Array.from(workspacesSet).sort(),
      senders: Array.from(sendersSet).sort(),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to compute conversation summary: ${message}` },
      { status: 500 }
    );
  }
}
