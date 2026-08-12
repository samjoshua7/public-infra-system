-- 004_approval_and_settings.sql
-- Run this in Supabase SQL Editor AFTER 001, 002, and 003.

-- =========================================================
-- 1. APPROVAL WORKFLOW
--    New citizen signups default to 'pending' and can't use the app
--    until an admin approves them. The two bootstrap accounts
--    (the government official + the one super admin) are auto-approved
--    since they're pre-vetted by email match, not by self-signup.
-- =========================================================
alter table public.users
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'CITIZEN';
  v_approval text := 'pending';
begin
  if new.email = 'samjoshua.paldwin@gmail.com' then
    v_role := 'ADMIN';
    v_approval := 'approved';
  elsif new.email = 'samc.ug.24.cs@francisxavier.ac.in' then
    v_role := 'GOVERNMENT_OFFICIAL';
    v_approval := 'approved';
  end if;

  insert into public.users (id, role, approval_status, name, email)
  values (new.id, v_role, v_approval, coalesce(new.raw_user_meta_data->>'name', new.email), new.email);
  return new;
end;
$$;

-- one-off fix in case either bootstrap account already exists as 'pending'
update public.users set approval_status = 'approved'
  where email in ('samjoshua.paldwin@gmail.com', 'samc.ug.24.cs@francisxavier.ac.in')
    and approval_status <> 'approved';

-- =========================================================
-- 2. APP SETTINGS (singleton row) — WhatsApp number + geofence config,
--    editable only by the admin, readable by everyone (including
--    logged-out visitors, since the waiting/geofence screen needs it
--    before a user is fully in).
-- =========================================================
create table if not exists public.app_settings (
  id boolean primary key default true,
  whatsapp_number text,
  geofence_center_lat numeric(9, 6),
  geofence_center_lng numeric(9, 6),
  geofence_radius_km numeric(6, 2),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select_all on public.app_settings;
create policy app_settings_select_all on public.app_settings for select
  using (true);

drop policy if exists app_settings_update_admin_only on public.app_settings;
create policy app_settings_update_admin_only on public.app_settings for update
  using (public.current_user_role() = 'ADMIN');

-- =========================================================
-- 3. LOCK THE ADMIN ROW — closes the "what if he self-removes himself"
--    risk at the database level, not just the UI. Once a row's role is
--    ADMIN, nobody (not even another admin, not even the account
--    itself) can change its role or approval_status. Also keeps the
--    existing rule that only an admin can change anyone ELSE's role
--    or approval_status.
-- =========================================================
create or replace function public.enforce_role_change_admin_only()
returns trigger language plpgsql as $$
begin
  if old.role = 'ADMIN' and (
    new.role is distinct from old.role
    or new.approval_status is distinct from old.approval_status
  ) then
    raise exception 'The admin account role and approval status cannot be modified';
  end if;

  if new.role is distinct from old.role and public.current_user_role() <> 'ADMIN' then
    raise exception 'Only an admin can change a user role';
  end if;

  if new.approval_status is distinct from old.approval_status and public.current_user_role() <> 'ADMIN' then
    raise exception 'Only an admin can change approval status';
  end if;

  return new;
end;
$$;
-- (trigger trg_users_enforce_role_change from migration 002 already points
--  at this function name, so no need to recreate the trigger itself)
