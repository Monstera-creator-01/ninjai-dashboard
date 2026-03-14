-- PROJ-2: Safe upsert functions + processing status
-- Fixes: BUG-17 (upsert overwrites upload_id), BUG-24 (premature success status)
-- Note: upload_id columns and indexes were added in a prior manual migration

-- ============================================================
-- 1. Add 'processing' status to upload_history
-- ============================================================
alter table public.upload_history
  drop constraint upload_history_status_check;

alter table public.upload_history
  add constraint upload_history_status_check
    check (status in ('processing', 'success', 'error'));

-- ============================================================
-- 3. Safe upsert for daily_metrics (preserves upload_id on conflict)
-- ============================================================
create or replace function safe_upsert_daily_metrics(p_rows jsonb, p_upload_id bigint)
returns void language sql as $$
  insert into public.daily_metrics (
    workspace, date, profile_views, post_likes, follows,
    messages_sent, total_message_started, total_message_replies,
    inmail_messages_sent, total_inmail_started, total_inmail_replies,
    connections_sent, connections_accepted,
    message_reply_rate, inmail_reply_rate, connection_acceptance_rate,
    upload_id, updated_at
  )
  select
    r->>'workspace',
    (r->>'date')::date,
    coalesce((r->>'profile_views')::int, 0),
    coalesce((r->>'post_likes')::int, 0),
    coalesce((r->>'follows')::int, 0),
    coalesce((r->>'messages_sent')::int, 0),
    coalesce((r->>'total_message_started')::int, 0),
    coalesce((r->>'total_message_replies')::int, 0),
    coalesce((r->>'inmail_messages_sent')::int, 0),
    coalesce((r->>'total_inmail_started')::int, 0),
    coalesce((r->>'total_inmail_replies')::int, 0),
    coalesce((r->>'connections_sent')::int, 0),
    coalesce((r->>'connections_accepted')::int, 0),
    coalesce((r->>'message_reply_rate')::numeric(5,2), 0),
    coalesce((r->>'inmail_reply_rate')::numeric(5,2), 0),
    coalesce((r->>'connection_acceptance_rate')::numeric(5,2), 0),
    p_upload_id,
    coalesce((r->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(p_rows) as r
  on conflict (workspace, date) do update set
    profile_views = excluded.profile_views,
    post_likes = excluded.post_likes,
    follows = excluded.follows,
    messages_sent = excluded.messages_sent,
    total_message_started = excluded.total_message_started,
    total_message_replies = excluded.total_message_replies,
    inmail_messages_sent = excluded.inmail_messages_sent,
    total_inmail_started = excluded.total_inmail_started,
    total_inmail_replies = excluded.total_inmail_replies,
    connections_sent = excluded.connections_sent,
    connections_accepted = excluded.connections_accepted,
    message_reply_rate = excluded.message_reply_rate,
    inmail_reply_rate = excluded.inmail_reply_rate,
    connection_acceptance_rate = excluded.connection_acceptance_rate,
    updated_at = excluded.updated_at;
    -- upload_id intentionally NOT updated — preserves original import ownership
$$;

-- ============================================================
-- 4. Safe upsert for conversations (preserves upload_id on conflict)
-- ============================================================
create or replace function safe_upsert_conversations(p_rows jsonb, p_upload_id bigint)
returns void language sql as $$
  insert into public.conversations (
    workspace, conversation_id, read, last_message_at, last_message_sender,
    is_inbound_reply, total_messages, inbound_message_count, outbound_message_count,
    conversation_depth_category,
    lead_first_name, lead_last_name, lead_headline, lead_position,
    lead_company, lead_location, lead_profile_url,
    sender_name, sender_email, sender_profile_url, sender_account_id,
    last_message_text, first_outbound_message, first_inbound_reply,
    custom_fields, upload_id, updated_at
  )
  select
    r->>'workspace',
    r->>'conversation_id',
    coalesce((r->>'read')::boolean, false),
    (r->>'last_message_at')::timestamptz,
    r->>'last_message_sender',
    coalesce((r->>'is_inbound_reply')::boolean, false),
    coalesce((r->>'total_messages')::int, 0),
    coalesce((r->>'inbound_message_count')::int, 0),
    coalesce((r->>'outbound_message_count')::int, 0),
    r->>'conversation_depth_category',
    r->>'lead_first_name',
    r->>'lead_last_name',
    r->>'lead_headline',
    r->>'lead_position',
    r->>'lead_company',
    r->>'lead_location',
    r->>'lead_profile_url',
    r->>'sender_name',
    r->>'sender_email',
    r->>'sender_profile_url',
    r->>'sender_account_id',
    r->>'last_message_text',
    r->>'first_outbound_message',
    r->>'first_inbound_reply',
    case when r->>'custom_fields' is not null
      then jsonb_build_object('raw', r->>'custom_fields')
      else null
    end,
    p_upload_id,
    coalesce((r->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(p_rows) as r
  on conflict (conversation_id) do update set
    workspace = excluded.workspace,
    read = excluded.read,
    last_message_at = excluded.last_message_at,
    last_message_sender = excluded.last_message_sender,
    is_inbound_reply = excluded.is_inbound_reply,
    total_messages = excluded.total_messages,
    inbound_message_count = excluded.inbound_message_count,
    outbound_message_count = excluded.outbound_message_count,
    conversation_depth_category = excluded.conversation_depth_category,
    lead_first_name = excluded.lead_first_name,
    lead_last_name = excluded.lead_last_name,
    lead_headline = excluded.lead_headline,
    lead_position = excluded.lead_position,
    lead_company = excluded.lead_company,
    lead_location = excluded.lead_location,
    lead_profile_url = excluded.lead_profile_url,
    sender_name = excluded.sender_name,
    sender_email = excluded.sender_email,
    sender_profile_url = excluded.sender_profile_url,
    sender_account_id = excluded.sender_account_id,
    last_message_text = excluded.last_message_text,
    first_outbound_message = excluded.first_outbound_message,
    first_inbound_reply = excluded.first_inbound_reply,
    custom_fields = excluded.custom_fields,
    updated_at = excluded.updated_at;
    -- upload_id intentionally NOT updated — preserves original import ownership
$$;
