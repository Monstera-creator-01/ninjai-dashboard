import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ConversationsResponse, ConversationWithTag, ReplyCategory } from "@/lib/types/messaging";

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceParam = searchParams.get("workspace"); // comma-separated
  const depthParam = searchParams.get("depth"); // comma-separated
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const senderParam = searchParams.get("sender");
  const repliedParam = searchParams.get("replied"); // "replied" | "not_replied"
  const categoryParam = searchParams.get("category"); // ReplyCategory | "untagged"
  const searchParam = searchParams.get("search");
  const sortParam = searchParams.get("sort") || "date_desc";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = Math.max(1, pageParam);

  try {
    // Use INNER JOIN when filtering by a specific category (so count + pagination are correct)
    const isSpecificCategory =
      categoryParam && categoryParam !== "all" && categoryParam !== "untagged";
    const tagJoin = isSpecificCategory
      ? "conversation_tags!inner(category, is_notable)"
      : "conversation_tags(category, is_notable)";

    const selectFields = `conversation_id, workspace, last_message_at, last_message_sender,
         is_inbound_reply, total_messages, conversation_depth_category,
         lead_first_name, lead_last_name, lead_headline, lead_position,
         lead_company, lead_location, lead_profile_url,
         sender_name, sender_email,
         first_outbound_message, first_inbound_reply, last_message_text,
         custom_fields,
         ${tagJoin}`;

    let query = supabase
      .from("conversations")
      .select(selectFields, { count: "exact" });

    // Filter by specific tag category at DB level
    if (isSpecificCategory) {
      query = query.eq("conversation_tags.category", categoryParam);
    }

    // For "untagged": exclude conversations that have any tag
    if (categoryParam === "untagged") {
      const { data: taggedRows } = await supabase
        .from("conversation_tags")
        .select("conversation_id");
      const taggedIds = (taggedRows ?? []).map((r: { conversation_id: string }) => r.conversation_id);
      if (taggedIds.length > 0) {
        query = query.not("conversation_id", "in", `(${taggedIds.join(",")})`);
      }
    }

    // Apply filters
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

    // Text search (ILIKE across multiple fields)
    if (searchParam && searchParam.length >= 2) {
      // Escape ILIKE special characters (% and _)
      const escaped = searchParam.replace(/[%_\\]/g, "\\$&");
      const searchTerm = `%${escaped}%`;
      query = query.or(
        `first_outbound_message.ilike.${searchTerm},first_inbound_reply.ilike.${searchTerm},last_message_text.ilike.${searchTerm},lead_first_name.ilike.${searchTerm},lead_last_name.ilike.${searchTerm},lead_company.ilike.${searchTerm}`
      );
    }

    // Sorting
    switch (sortParam) {
      case "date_asc":
        query = query.order("last_message_at", { ascending: true, nullsFirst: false });
        break;
      case "depth_desc":
        query = query.order("total_messages", { ascending: false });
        break;
      case "depth_asc":
        query = query.order("total_messages", { ascending: true });
        break;
      case "workspace":
        query = query.order("workspace", { ascending: true });
        break;
      default: // date_desc
        query = query.order("last_message_at", { ascending: false, nullsFirst: true });
    }

    // Pagination
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch conversations: ${error.message}` },
        { status: 500 }
      );
    }

    const total = count ?? 0;

    // Transform: flatten conversation_tags join into tag_category / is_notable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations: ConversationWithTag[] = (data ?? []).map((row: any) => {
      // conversation_tags is returned as array (from LEFT JOIN), take first or null
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
      };
    });

    const response: ConversationsResponse = {
      conversations,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch conversations: ${message}` },
      { status: 500 }
    );
  }
}
