import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TagUpdateRequest, TagUpdateResponse, ReplyCategory } from "@/lib/types/messaging";

const VALID_CATEGORIES: ReplyCategory[] = [
  "interested",
  "objection",
  "not_now",
  "wrong_person",
  "not_interested",
  "referral",
];

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TagUpdateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, category, isNotable } = body;

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }

  // Validate category if provided
  if (category !== undefined && category !== null) {
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
  }

  try {
    // Check if conversation exists
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("conversation_id")
      .eq("conversation_id", conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Check if a tag already exists for this conversation
    const { data: existingTag } = await supabase
      .from("conversation_tags")
      .select("category, is_notable")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    // Determine final values by merging with existing tag
    const finalCategory = category !== undefined ? category : (existingTag?.category ?? null);
    const finalIsNotable = isNotable !== undefined ? isNotable : (existingTag?.is_notable ?? false);

    // Only delete if both category and notable are cleared
    if (!finalCategory && !finalIsNotable) {
      if (existingTag) {
        await supabase
          .from("conversation_tags")
          .delete()
          .eq("conversation_id", conversationId);
      }

      const response: TagUpdateResponse = {
        conversationId,
        category: null,
        isNotable: false,
      };
      return NextResponse.json(response);
    }

    // Upsert the tag with merged values
    const upsertData: Record<string, unknown> = {
      conversation_id: conversationId,
      category: finalCategory,
      is_notable: finalIsNotable,
      tagged_by: user.id,
      tagged_at: new Date().toISOString(),
    };

    const { data: tag, error: upsertError } = await supabase
      .from("conversation_tags")
      .upsert(upsertData, { onConflict: "conversation_id" })
      .select("conversation_id, category, is_notable")
      .single();

    if (upsertError) {
      return NextResponse.json(
        { error: `Failed to update tag: ${upsertError.message}` },
        { status: 500 }
      );
    }

    const response: TagUpdateResponse = {
      conversationId: tag.conversation_id,
      category: tag.category as ReplyCategory | null,
      isNotable: tag.is_notable,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update tag: ${message}` },
      { status: 500 }
    );
  }
}
