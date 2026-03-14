import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REPLY_CATEGORIES } from "@/lib/types/messaging";
import type { ReplyCategory } from "@/lib/types/messaging";
import type {
  SegmentDimension,
  SegmentData,
  SegmentComparisonResponse,
  CategoryBreakdownItem,
  DepthDistributionItem,
  SegmentTopSender,
} from "@/lib/types/segments";

const VALID_DIMENSIONS: SegmentDimension[] = ["workspace", "sender", "position", "category"];

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dimensionParam = searchParams.get("dimension");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Validate dimension
  if (!dimensionParam || !VALID_DIMENSIONS.includes(dimensionParam as SegmentDimension)) {
    return NextResponse.json(
      { error: `Invalid dimension. Must be one of: ${VALID_DIMENSIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const dimension = dimensionParam as SegmentDimension;

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateFrom && !dateRegex.test(dateFrom)) {
    return NextResponse.json(
      { error: "Invalid dateFrom format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }
  if (dateTo && !dateRegex.test(dateTo)) {
    return NextResponse.json(
      { error: "Invalid dateTo format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return NextResponse.json(
      { error: "dateFrom must not be after dateTo." },
      { status: 400 }
    );
  }

  try {
    // Check if any conversations exist at all (independent of date filter)
    const { count: totalCount } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true });
    const hasAnyConversations = (totalCount ?? 0) > 0;

    // Fetch conversations with tags
    let query = supabase
      .from("conversations")
      .select(
        `conversation_id, workspace, last_message_at,
         is_inbound_reply, total_messages, conversation_depth_category,
         lead_position, sender_name,
         conversation_tags(category, is_notable)`
      )
      .limit(10000);

    // Apply date filters on last_message_at
    if (dateFrom) {
      query = query.gte("last_message_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("last_message_at", dateTo + "T23:59:59.999Z");
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch conversations: ${error.message}` },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    // Transform rows with tag info
    const conversations = rows.map((row) => {
      const tagArray = row.conversation_tags as
        | { category: string | null; is_notable: boolean }[]
        | null;
      const tag = Array.isArray(tagArray) && tagArray.length > 0 ? tagArray[0] : null;

      return {
        conversation_id: row.conversation_id,
        workspace: row.workspace as string,
        last_message_at: row.last_message_at as string | null,
        is_inbound_reply: row.is_inbound_reply as boolean,
        total_messages: row.total_messages as number,
        conversation_depth_category: row.conversation_depth_category as string | null,
        lead_position: row.lead_position as string | null,
        sender_name: row.sender_name as string | null,
        tag_category: (tag?.category as ReplyCategory) ?? null,
      };
    });

    // Group by dimension
    const groups: Record<string, typeof conversations> = {};

    for (const c of conversations) {
      let key: string;

      switch (dimension) {
        case "workspace":
          key = c.workspace || "Keine Angabe";
          break;
        case "sender":
          key = c.sender_name || "Keine Angabe";
          break;
        case "position":
          key = c.lead_position || "Keine Angabe";
          break;
        case "category":
          key = c.tag_category
            ? REPLY_CATEGORIES.find((rc) => rc.value === c.tag_category)?.label ?? c.tag_category
            : "Untagged";
          break;
        default:
          key = "Unknown";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(c);
    }

    // Compute segment data for each group
    const segments: SegmentData[] = Object.entries(groups).map(([segmentValue, groupConvos]) => {
      const conversationCount = groupConvos.length;
      const repliedCount = groupConvos.filter((c) => c.is_inbound_reply).length;
      const replyRate =
        conversationCount > 0
          ? Math.round((repliedCount / conversationCount) * 100 * 10) / 10
          : 0;

      const totalDepth = groupConvos.reduce((sum, c) => sum + (c.total_messages || 0), 0);
      const avgDepth =
        conversationCount > 0
          ? Math.round((totalDepth / conversationCount) * 10) / 10
          : 0;

      // Category breakdown
      const catCounts: Record<string, number> = {};
      for (const c of groupConvos) {
        const cat = c.tag_category || "untagged";
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }

      const categoryBreakdown: CategoryBreakdownItem[] = [];
      const taggedTotal = Object.entries(catCounts)
        .filter(([key]) => key !== "untagged")
        .reduce((sum, [, count]) => sum + count, 0);

      for (const rc of REPLY_CATEGORIES) {
        const count = catCounts[rc.value] || 0;
        if (count > 0) {
          categoryBreakdown.push({
            category: rc.value,
            label: rc.label,
            count,
            percentage: taggedTotal > 0 ? Math.round((count / taggedTotal) * 100) : 0,
            color: rc.color,
          });
        }
      }

      // Add untagged if present
      if (catCounts["untagged"]) {
        categoryBreakdown.push({
          category: "untagged",
          label: "Untagged",
          count: catCounts["untagged"],
          percentage: 0, // Not included in percentage calc
          color: "#d1d5db",
        });
      }

      // Top category (most common tagged category)
      let topCategory: string | null = null;
      let topCategoryCount = 0;
      for (const item of categoryBreakdown) {
        if (item.category !== "untagged" && item.count > topCategoryCount) {
          topCategoryCount = item.count;
          topCategory = item.label;
        }
      }

      // Depth distribution
      const depthCounts: Record<string, number> = {};
      for (const c of groupConvos) {
        const cat = c.conversation_depth_category || "unknown";
        depthCounts[cat] = (depthCounts[cat] || 0) + 1;
      }
      const depthDistribution: DepthDistributionItem[] = Object.entries(depthCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => {
          // Sort: 1-touch, 2-touch, 3+ touch, unknown
          const order: Record<string, number> = { "1-touch": 0, "2-touch": 1, "3+ touch": 2 };
          const orderA = order[a.category] ?? 99;
          const orderB = order[b.category] ?? 99;
          return orderA - orderB;
        });

      // Top 3 senders (only when dimension != "sender")
      let topSenders: SegmentTopSender[] = [];
      if (dimension !== "sender") {
        const senderStats: Record<string, { total: number; replies: number }> = {};
        for (const c of groupConvos) {
          const name = c.sender_name || "Unknown";
          if (!senderStats[name]) {
            senderStats[name] = { total: 0, replies: 0 };
          }
          senderStats[name].total++;
          if (c.is_inbound_reply) senderStats[name].replies++;
        }
        topSenders = Object.entries(senderStats)
          .map(([senderName, stats]) => ({
            senderName,
            conversationCount: stats.total,
            replyRate:
              stats.total > 0
                ? Math.round((stats.replies / stats.total) * 100 * 10) / 10
                : 0,
          }))
          .sort((a, b) => b.replyRate - a.replyRate)
          .slice(0, 3);
      }

      return {
        segmentValue,
        conversationCount,
        replyRate,
        avgDepth,
        topCategory,
        categoryBreakdown,
        depthDistribution,
        topSenders,
        isSmallSample: conversationCount < 5,
      };
    });

    // Sort by conversation count descending
    segments.sort((a, b) => b.conversationCount - a.conversationCount);

    const response: SegmentComparisonResponse = {
      segments,
      totalSegments: segments.length,
      dimension,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      hasAnyConversations,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to compute segment comparison: ${message}` },
      { status: 500 }
    );
  }
}
