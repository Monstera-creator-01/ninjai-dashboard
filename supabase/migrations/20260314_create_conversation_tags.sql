-- PROJ-5: Weekly Messaging Insight Summary
-- Creates conversation_tags table for manual reply categorization (AC-4)
-- Each conversation can have at most one tag (reply category + notable flag)

-- ============================================================
-- 1. conversation_tags table
-- ============================================================
create table public.conversation_tags (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null
    references public.conversations (conversation_id)
    on delete cascade,
  category text check (category in (
    'interested',
    'objection',
    'not_now',
    'wrong_person',
    'not_interested',
    'referral'
  )),
  is_notable boolean not null default false,
  tagged_by uuid references public.profiles (id) on delete set null,
  tagged_at timestamptz not null default now(),

  -- Max 1 tag per conversation
  constraint conversation_tags_conversation_id_unique unique (conversation_id)
);

-- ============================================================
-- 2. Enable Row Level Security
-- ============================================================
alter table public.conversation_tags enable row level security;

-- ============================================================
-- 3. RLS Policies (all authenticated team members can CRUD)
-- ============================================================
create policy "Authenticated users can view conversation tags"
  on public.conversation_tags for select
  to authenticated
  using (true);

create policy "Authenticated users can insert conversation tags"
  on public.conversation_tags for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update conversation tags"
  on public.conversation_tags for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete conversation tags"
  on public.conversation_tags for delete
  to authenticated
  using (true);

-- ============================================================
-- 4. Indexes for performance
-- ============================================================
-- conversation_id is already indexed via the UNIQUE constraint

-- Index on category for filtering conversations by reply type
create index idx_conversation_tags_category
  on public.conversation_tags (category);

-- Index on is_notable for querying notable conversations
create index idx_conversation_tags_is_notable
  on public.conversation_tags (is_notable)
  where (is_notable = true);

-- Index on tagged_by for potential audit queries
create index idx_conversation_tags_tagged_by
  on public.conversation_tags (tagged_by);
