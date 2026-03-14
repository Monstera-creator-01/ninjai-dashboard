-- PROJ-2: CSV Data Import (Heyreach)
-- Creates daily_metrics, conversations, and upload_history tables

-- ============================================================
-- 1. daily_metrics table
-- ============================================================
create table public.daily_metrics (
  id bigint generated always as identity primary key,
  workspace text not null,
  date date not null,
  profile_views integer not null default 0,
  post_likes integer not null default 0,
  follows integer not null default 0,
  messages_sent integer not null default 0,
  total_message_started integer not null default 0,
  total_message_replies integer not null default 0,
  inmail_messages_sent integer not null default 0,
  total_inmail_started integer not null default 0,
  total_inmail_replies integer not null default 0,
  connections_sent integer not null default 0,
  connections_accepted integer not null default 0,
  message_reply_rate numeric(5,2) not null default 0,
  inmail_reply_rate numeric(5,2) not null default 0,
  connection_acceptance_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_metrics_workspace_date_unique unique (workspace, date)
);

-- Enable RLS
alter table public.daily_metrics enable row level security;

-- All authenticated users can read
create policy "Authenticated users can view daily metrics"
  on public.daily_metrics for select
  to authenticated
  using (true);

-- Indexes
create index idx_daily_metrics_workspace on public.daily_metrics (workspace);
create index idx_daily_metrics_date on public.daily_metrics (date);

-- Auto-update updated_at
create trigger on_daily_metrics_updated
  before update on public.daily_metrics
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- 2. conversations table
-- ============================================================
create table public.conversations (
  id bigint generated always as identity primary key,
  workspace text not null,
  conversation_id text not null unique,
  read boolean not null default false,
  last_message_at timestamptz,
  last_message_sender text,
  is_inbound_reply boolean not null default false,
  total_messages integer not null default 0,
  inbound_message_count integer not null default 0,
  outbound_message_count integer not null default 0,
  conversation_depth_category text,
  lead_first_name text,
  lead_last_name text,
  lead_headline text,
  lead_position text,
  lead_company text,
  lead_location text,
  lead_profile_url text,
  sender_name text,
  sender_email text,
  sender_profile_url text,
  sender_account_id text,
  last_message_text text,
  first_outbound_message text,
  first_inbound_reply text,
  custom_fields jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.conversations enable row level security;

-- All authenticated users can read
create policy "Authenticated users can view conversations"
  on public.conversations for select
  to authenticated
  using (true);

-- Indexes
create index idx_conversations_workspace on public.conversations (workspace);
create index idx_conversations_last_message_at on public.conversations (last_message_at desc);

-- Auto-update updated_at
create trigger on_conversations_updated
  before update on public.conversations
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- 3. upload_history table
-- ============================================================
create table public.upload_history (
  id bigint generated always as identity primary key,
  filename text not null,
  csv_type text not null check (csv_type in ('activity_metrics', 'conversation_data')),
  row_count integer not null default 0,
  rows_processed integer not null default 0,
  status text not null check (status in ('success', 'error')),
  error_message text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- Enable RLS
alter table public.upload_history enable row level security;

-- All authenticated users can read
create policy "Authenticated users can view upload history"
  on public.upload_history for select
  to authenticated
  using (true);

-- Index for recent-first queries
create index idx_upload_history_uploaded_at on public.upload_history (uploaded_at desc);
create index idx_upload_history_uploaded_by on public.upload_history (uploaded_by);
