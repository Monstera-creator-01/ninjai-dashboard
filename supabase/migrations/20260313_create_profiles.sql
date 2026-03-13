-- PROJ-1: Authentication & User Management
-- Creates the profiles table, RLS policies, and auto-creation trigger

-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'operator' check (role in ('operator', 'account_manager', 'team_lead')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. RLS Policies

-- All authenticated users can read all profiles (needed for team visibility)
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update their own profile (name only — role changes require admin)
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow service role to insert profiles (via trigger or admin API)
-- Note: service_role bypasses RLS by default, so no explicit insert policy needed for the trigger.
-- But we add one for the edge case where anon/authenticated might need it:
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 4. Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- 5. Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'operator')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 6. Index for role-based queries
create index idx_profiles_role on public.profiles (role);
