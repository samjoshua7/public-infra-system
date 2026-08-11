-- 001_init.sql
-- Public Infrastructure Reporting and Tracking System — initial schema
-- Run this ENTIRE file once in Supabase SQL Editor (Project -> SQL Editor -> New query -> paste -> Run)

create extension if not exists pgcrypto;

-- =========================================================
-- USERS
-- =========================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'CITIZEN' check (role in ('CITIZEN','GOVERNMENT_OFFICIAL','ADMIN')),
  name text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-create a public.users row whenever someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role, name, email)
  values (new.id, 'CITIZEN', coalesce(new.raw_user_meta_data->>'name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- generic updated_at helper, reused by several tables below
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- =========================================================
-- ISSUE_REPORTS
-- =========================================================
create table public.issue_reports (
  report_id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  photo_url text not null,
  title text not null,
  description text not null,
  category text not null check (category in ('pothole','streetlight','traffic_light','garbage','other')),
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  status text not null default 'posted' check (status in ('posted','action_taken','fixed')),
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_issue_reports_status_created on public.issue_reports(status, created_at desc);
create index idx_issue_reports_category_created on public.issue_reports(category, created_at desc);
create index idx_issue_reports_reporter on public.issue_reports(reporter_id);
create index idx_issue_reports_geo on public.issue_reports(latitude, longitude);

create trigger trg_issue_reports_updated_at
  before update on public.issue_reports
  for each row execute function public.set_updated_at();

-- =========================================================
-- REPORT_STATUS_HISTORY (authoritative audit trail)
-- =========================================================
create table public.report_status_history (
  history_id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.issue_reports(report_id) on delete cascade,
  status text not null check (status in ('posted','action_taken','fixed')),
  changed_by uuid references public.users(id),
  note text,
  created_at timestamptz not null default now()
);

create index idx_status_history_report_created on public.report_status_history(report_id, created_at);

-- seed the first "posted" history row automatically when a report is created
create or replace function public.handle_new_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.report_status_history (report_id, status, changed_by, note)
  values (new.report_id, 'posted', new.reporter_id, 'Report submitted');
  return new;
end;
$$;

create trigger trg_issue_reports_after_insert
  after insert on public.issue_reports
  for each row execute function public.handle_new_report();

-- =========================================================
-- REPORT_LIKES
-- =========================================================
create table public.report_likes (
  report_id uuid not null references public.issue_reports(report_id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index idx_report_likes_report on public.report_likes(report_id);

-- =========================================================
-- REPORT_COMMENTS
-- =========================================================
create table public.report_comments (
  comment_id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.issue_reports(report_id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_report_comments_report_created on public.report_comments(report_id, created_at);

create trigger trg_report_comments_updated_at
  before update on public.report_comments
  for each row execute function public.set_updated_at();

-- =========================================================
-- DENORMALIZED COUNT CACHES (like_count / comment_count)
-- =========================================================
create or replace function public.sync_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.issue_reports set like_count = like_count + 1 where report_id = new.report_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.issue_reports set like_count = greatest(like_count - 1, 0) where report_id = old.report_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_report_likes_after_change
  after insert or delete on public.report_likes
  for each row execute function public.sync_like_count();

create or replace function public.sync_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.issue_reports set comment_count = comment_count + 1 where report_id = new.report_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.issue_reports set comment_count = greatest(comment_count - 1, 0) where report_id = old.report_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_report_comments_after_change
  after insert or delete on public.report_comments
  for each row execute function public.sync_comment_count();

-- =========================================================
-- ROLE HELPER + STATUS TRANSITION FUNCTION
-- =========================================================
create or replace function public.current_user_role()
returns text language sql stable as $$
  select role from public.users where id = auth.uid();
$$;

-- The ONLY path allowed to change a report's status.
-- Validates role (GOVERNMENT_OFFICIAL/ADMIN) and enforces forward-only transitions.
create or replace function public.update_report_status(p_report_id uuid, p_new_status text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_current_status text;
  v_role text;
begin
  v_role := public.current_user_role();
  if v_role not in ('GOVERNMENT_OFFICIAL','ADMIN') then
    raise exception 'Only government officials or admins can update report status';
  end if;

  select status into v_current_status from public.issue_reports where report_id = p_report_id;

  if v_current_status is null then
    raise exception 'Report not found';
  end if;

  if not (
    (v_current_status = 'posted' and p_new_status = 'action_taken') or
    (v_current_status = 'action_taken' and p_new_status = 'fixed')
  ) then
    raise exception 'Invalid status transition from % to %', v_current_status, p_new_status;
  end if;

  insert into public.report_status_history (report_id, status, changed_by, note)
  values (p_report_id, p_new_status, auth.uid(), p_note);

  update public.issue_reports set status = p_new_status, updated_at = now() where report_id = p_report_id;
end;
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.users enable row level security;
alter table public.issue_reports enable row level security;
alter table public.report_status_history enable row level security;
alter table public.report_likes enable row level security;
alter table public.report_comments enable row level security;

-- users
create policy users_select_own_or_admin on public.users for select
  using (id = auth.uid() or public.current_user_role() = 'ADMIN');

create policy users_update_own_or_admin on public.users for update
  using (id = auth.uid() or public.current_user_role() = 'ADMIN');

-- issue_reports (public feed = readable by anyone; insert only your own; no direct update/delete)
create policy issue_reports_select_all on public.issue_reports for select
  using (true);

create policy issue_reports_insert_own on public.issue_reports for insert
  with check (reporter_id = auth.uid());

-- report_status_history (readable by anyone; writes only via update_report_status())
create policy status_history_select_all on public.report_status_history for select
  using (true);

-- report_likes
create policy report_likes_select_all on public.report_likes for select
  using (true);

create policy report_likes_insert_own on public.report_likes for insert
  with check (user_id = auth.uid());

create policy report_likes_delete_own on public.report_likes for delete
  using (user_id = auth.uid());

-- report_comments
create policy report_comments_select_all on public.report_comments for select
  using (true);

create policy report_comments_insert_own on public.report_comments for insert
  with check (user_id = auth.uid());

create policy report_comments_update_own on public.report_comments for update
  using (user_id = auth.uid());

create policy report_comments_delete_own_or_admin on public.report_comments for delete
  using (user_id = auth.uid() or public.current_user_role() = 'ADMIN');

-- =========================================================
-- STORAGE (report photos)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "Public read report photos"
  on storage.objects for select
  using (bucket_id = 'report-photos');

create policy "Authenticated users can upload report photos"
  on storage.objects for insert
  with check (bucket_id = 'report-photos' and auth.role() = 'authenticated');
