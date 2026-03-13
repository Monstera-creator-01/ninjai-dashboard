-- PROJ-1: Fix BUG-1 (Critical) — Privilege Escalation via Self-Role-Update
-- The original UPDATE policy allows users to change ALL columns including `role`.
-- This migration restricts the UPDATE policy so users can only change `full_name`.

-- Drop the overly permissive UPDATE policy
drop policy if exists "Users can update their own profile" on public.profiles;

-- Create a restricted UPDATE policy: users can update their own row,
-- but the role column must remain unchanged (prevents self-role-assignment)
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );
