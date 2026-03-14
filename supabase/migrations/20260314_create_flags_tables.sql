-- PROJ-8: Campaign Intervention Flag System
-- Creates flags and flag_thresholds tables with RLS, indexes, and seed data

-- ============================================================
-- 1. flags table
-- ============================================================
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  flag_type text not null check (flag_type in (
    'low_acceptance', 'low_reply', 'activity_drop',
    'sender_inactive', 'high_rejection', 'declining_trend', 'no_replies'
  )),
  severity text not null check (severity in ('high', 'medium')),
  triggered_value text not null,
  threshold_value text not null,
  status text not null default 'active' check (status in ('active', 'acknowledged', 'resolved')),
  acknowledged_by uuid references public.profiles (id) on delete set null,
  acknowledgment_note text,
  resolved_at timestamptz,
  resolution_type text check (resolution_type in ('auto', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partial unique index: only one active/acknowledged flag per workspace + type
-- This prevents duplicate active flags for the same workspace + flag type
create unique index idx_flags_active_unique
  on public.flags (workspace, flag_type)
  where (status in ('active', 'acknowledged'));

-- Enable RLS
alter table public.flags enable row level security;

-- RLS Policies
create policy "Authenticated users can view flags"
  on public.flags for select
  to authenticated
  using (true);

create policy "Authenticated users can insert flags"
  on public.flags for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update flags"
  on public.flags for update
  to authenticated
  using (true)
  with check (true);

-- Note: No DELETE policy — flags are never deleted, only resolved.
-- Service role (admin client) bypasses RLS for flag evaluation.

-- Indexes for common queries
create index idx_flags_status on public.flags (status);
create index idx_flags_workspace on public.flags (workspace);
create index idx_flags_severity on public.flags (severity);
create index idx_flags_created_at on public.flags (created_at desc);
create index idx_flags_status_severity on public.flags (status, severity);

-- Auto-update updated_at
create trigger on_flags_updated
  before update on public.flags
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- 2. flag_thresholds table
-- ============================================================
create table public.flag_thresholds (
  id uuid primary key default gen_random_uuid(),
  flag_type text not null unique check (flag_type in (
    'low_acceptance', 'low_reply', 'activity_drop',
    'sender_inactive', 'high_rejection', 'declining_trend', 'no_replies'
  )),
  display_name text not null,
  description text not null default '',
  threshold_value numeric(10,2) not null,
  comparison_period_days integer not null default 7,
  severity text not null check (severity in ('high', 'medium')),
  enabled boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.flag_thresholds enable row level security;

-- RLS Policies
create policy "Authenticated users can view thresholds"
  on public.flag_thresholds for select
  to authenticated
  using (true);

-- Only team_lead can update thresholds (enforced at API level too,
-- but RLS provides defense-in-depth)
create policy "Team leads can update thresholds"
  on public.flag_thresholds for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'team_lead'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'team_lead'
    )
  );

-- Auto-update updated_at
create trigger on_flag_thresholds_updated
  before update on public.flag_thresholds
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- 3. Seed default thresholds
-- ============================================================
insert into public.flag_thresholds (flag_type, display_name, description, threshold_value, comparison_period_days, severity, enabled) values
  ('low_acceptance', 'Low Connection Acceptance', 'Connection acceptance rate below threshold over the comparison period', 8, 7, 'high', true),
  ('low_reply', 'Low Reply Rate', 'Reply rate below threshold over the comparison period', 5, 7, 'high', true),
  ('activity_drop', 'Activity Drop', 'Connections sent dropped significantly compared to previous period', 50, 7, 'high', true),
  ('sender_inactive', 'Sender Inactive', 'A sender account has had zero activity for 3+ weekdays', 3, 3, 'medium', false),
  ('high_rejection', 'High Rejection Pattern', 'High percentage of replies tagged as Not interested or Wrong person', 30, 7, 'medium', false),
  ('declining_trend', 'Declining Trend', 'Key metrics declining for 3+ consecutive weeks', 3, 21, 'medium', true),
  ('no_replies', 'No Replies', 'Zero inbound replies over the comparison period despite active messaging', 0, 7, 'high', true);
