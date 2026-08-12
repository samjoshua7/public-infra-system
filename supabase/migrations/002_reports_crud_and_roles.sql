-- 002_reports_crud_and_roles.sql
-- Run this in Supabase SQL Editor AFTER 001_init.sql.
-- Adds: owner edit/delete/hide on reports, and auto role-assignment for the
-- two bootstrap accounts (government official + the one super admin).

-- =========================================================
-- 1. HIDE FLAG
-- =========================================================
alter table public.issue_reports
  add column if not exists is_hidden boolean not null default false;

-- =========================================================
-- 2. FEED VISIBILITY: hidden reports are only visible to their owner
--    and to officials/admins (so officials still see everything).
-- =========================================================
drop policy if exists issue_reports_select_all on public.issue_reports;

create policy issue_reports_select_visible on public.issue_reports for select
  using (
    not is_hidden
    or reporter_id = auth.uid()
    or public.current_user_role() in ('GOVERNMENT_OFFICIAL', 'ADMIN')
  );

-- =========================================================
-- 3. OWNER EDIT / DELETE
--    - Owner (or admin) can UPDATE their own report.
--    - A trigger enforces the actual business rules:
--        * is_hidden can be toggled any time by the owner/admin
--        * title/description/category/photo_url can only change
--          while status is still 'posted' (i.e. before any official
--          has acted on it) — admins are exempt
--        * status itself can never be changed through this path —
--          that stays exclusive to update_report_status()
--    - Owner (or admin) can DELETE their own report only while it's
--      still 'posted' (nothing to preserve in the audit trail yet).
--      Admins can delete regardless of status.
-- =========================================================
create policy issue_reports_update_own_or_admin on public.issue_reports for update
  using (reporter_id = auth.uid() or public.current_user_role() = 'ADMIN')
  with check (reporter_id = auth.uid() or public.current_user_role() = 'ADMIN');

create policy issue_reports_delete_own_or_admin on public.issue_reports for delete
  using (
    (reporter_id = auth.uid() and status = 'posted')
    or public.current_user_role() = 'ADMIN'
  );

create or replace function public.enforce_report_edit_rules()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    raise exception 'Status can only be changed via update_report_status()';
  end if;

  if (
    new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.category is distinct from old.category
    or new.photo_url is distinct from old.photo_url
  ) then
    if old.status <> 'posted' and public.current_user_role() <> 'ADMIN' then
      raise exception 'Report details can only be edited while status is posted';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_issue_reports_enforce_edit_rules on public.issue_reports;
create trigger trg_issue_reports_enforce_edit_rules
  before update on public.issue_reports
  for each row execute function public.enforce_report_edit_rules();

-- =========================================================
-- 4. ROLE BOOTSTRAP: auto-assign the two known accounts on signup
--    - samjoshua.paldwin@gmail.com  -> ADMIN (the only super admin)
--    - samc.ug.24.cs@francisxavier.ac.in -> GOVERNMENT_OFFICIAL
--    Everyone else still defaults to CITIZEN.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'CITIZEN';
begin
  if new.email = 'samjoshua.paldwin@gmail.com' then
    v_role := 'ADMIN';
  elsif new.email = 'samc.ug.24.cs@francisxavier.ac.in' then
    v_role := 'GOVERNMENT_OFFICIAL';
  end if;

  insert into public.users (id, role, name, email)
  values (new.id, v_role, coalesce(new.raw_user_meta_data->>'name', new.email), new.email);
  return new;
end;
$$;

-- One-off fix in case either account already signed up before this migration ran
update public.users set role = 'ADMIN'
  where email = 'samjoshua.paldwin@gmail.com' and role <> 'ADMIN';

update public.users set role = 'GOVERNMENT_OFFICIAL'
  where email = 'samc.ug.24.cs@francisxavier.ac.in' and role <> 'GOVERNMENT_OFFICIAL';

-- =========================================================
-- 5. SECURITY FIX: close a hole in 001_init.sql — the existing
--    users_update_own_or_admin policy let a CITIZEN update their OWN
--    row, which technically included the role column (i.e. a citizen
--    could have set their own role to ADMIN via a direct client call).
--    This trigger blocks any role change unless the actor is already
--    an ADMIN.
-- =========================================================
create or replace function public.enforce_role_change_admin_only()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and public.current_user_role() <> 'ADMIN' then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_enforce_role_change on public.users;
create trigger trg_users_enforce_role_change
  before update on public.users
  for each row execute function public.enforce_role_change_admin_only();
