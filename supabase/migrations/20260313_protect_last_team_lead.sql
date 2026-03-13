-- PROJ-1: Fix BUG-6 — Prevent removal of the last team lead
-- If only one team_lead remains, their role cannot be changed.

create or replace function public.prevent_last_team_lead_removal()
returns trigger as $$
begin
  -- Only check when role is being changed FROM team_lead
  if old.role = 'team_lead' and new.role != 'team_lead' then
    if (select count(*) from public.profiles where role = 'team_lead') <= 1 then
      raise exception 'Cannot remove the last team lead. Assign another team lead first.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_team_lead_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_last_team_lead_removal();
