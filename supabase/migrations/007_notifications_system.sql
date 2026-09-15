-- 007_notifications_system.sql
-- Run this in Supabase SQL Editor AFTER 001 through 006.
--
-- Implements the Civic Notification Engine:
-- 1. Table public.notifications with RLS and Realtime publication.
-- 2. Trigger on issue_reports (after insert) -> notifies all active approved users of new reports.
-- 3. Trigger on report_status_history (after insert) -> notifies users who liked that post ('The post you liked got updated') & original reporter.
-- 4. Trigger on users (after update of approval_status) -> notifies citizen when approved by Admin.

-- =========================================================
-- 1. NOTIFICATIONS TABLE
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('new_report', 'status_change', 'account_approved', 'system')),
  title text not null,
  message text not null,
  subtext text,
  report_id uuid references public.issue_reports(report_id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Efficient indexing for user notification feed, unread counters, and cascade lookups
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read);
create index if not exists idx_notifications_report on public.notifications(report_id);

-- =========================================================
-- 2. ROW LEVEL SECURITY
-- =========================================================
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete using (auth.uid() = user_id);

drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin on public.notifications
  for insert with check (public.current_user_role() = 'ADMIN');

-- =========================================================
-- 3. HELPER: FRIENDLY STATUS LABELS
-- =========================================================
create or replace function public.get_friendly_status_name(p_status text)
returns text language sql immutable as $$
  select case p_status
    when 'ordered' then 'Ordered'
    when 'budget_allocated' then 'Budget Allocated'
    when 'on_process' then 'In Progress'
    when 'finished' then 'Finished'
    else initcap(replace(p_status, '_', ' '))
  end;
$$;

-- =========================================================
-- 4. TRIGGER 1: NEW POST BROADCAST NOTIFICATION
--    When a new report is posted, notify all active approved citizens
-- =========================================================
create or replace function public.handle_new_report_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_reporter_name text;
  v_category_name text;
begin
  select coalesce(name, 'A citizen') into v_reporter_name
  from public.users where id = new.reporter_id;

  v_category_name := case new.category
    when 'pothole' then 'Pothole'
    when 'streetlight' then 'Broken Streetlight'
    when 'traffic_light' then 'Traffic Light'
    when 'garbage' then 'Garbage'
    else 'Infrastructure Issue'
  end;

  insert into public.notifications (user_id, type, title, message, subtext, report_id)
  select
    u.id,
    'new_report',
    'New Infrastructure Report',
    format('%s reported a %s: "%s"', v_reporter_name, v_category_name, new.title),
    'In your community',
    new.report_id
  from public.users u
  where u.id <> new.reporter_id
    and u.active = true
    and u.approval_status = 'approved';

  return new;
end;
$$;

drop trigger if exists trg_notify_new_report on public.issue_reports;
create trigger trg_notify_new_report
  after insert on public.issue_reports
  for each row execute function public.handle_new_report_notification();

-- =========================================================
-- 5. TRIGGER 2: OFFICIAL STATUS UPDATE NOTIFICATION
--    When report status moves forward, notify users who liked that post
--    ("The post you liked got updated") and original reporter ("Your reported issue was updated")
-- =========================================================
create or replace function public.handle_status_change_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_report record;
  v_friendly_status text;
  v_status_message text;
  v_note_suffix text := '';
begin
  -- Skip initial seed row created when a report is first submitted
  if new.status = 'ordered' then
    return new;
  end if;

  select reporter_id, title into v_report
  from public.issue_reports
  where report_id = new.report_id;

  if v_report is null then
    return new;
  end if;

  v_friendly_status := public.get_friendly_status_name(new.status);

  if new.note is not null and length(trim(new.note)) > 0 then
    v_note_suffix := format(' — Note: "%s"', trim(new.note));
  end if;

  v_status_message := format('"%s" is under %s%s', v_report.title, v_friendly_status, v_note_suffix);

  -- 1. Notify users who liked the post (excluding official and reporter)
  insert into public.notifications (user_id, type, title, message, subtext, report_id)
  select
    l.user_id,
    'status_change',
    format('Status Update: %s', v_friendly_status),
    v_status_message,
    'The post you liked got updated',
    new.report_id
  from public.report_likes l
  where l.report_id = new.report_id
    and l.user_id <> coalesce(new.changed_by, '00000000-0000-0000-0000-000000000000'::uuid)
    and l.user_id <> v_report.reporter_id;

  -- 2. Notify the original reporter (if not the one who updated it)
  if v_report.reporter_id <> coalesce(new.changed_by, '00000000-0000-0000-0000-000000000000'::uuid) then
    insert into public.notifications (user_id, type, title, message, subtext, report_id)
    values (
      v_report.reporter_id,
      'status_change',
      format('Status Update: %s', v_friendly_status),
      v_status_message,
      'Your reported issue was updated',
      new.report_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_status_change on public.report_status_history;
create trigger trg_notify_status_change
  after insert on public.report_status_history
  for each row execute function public.handle_status_change_notification();

-- =========================================================
-- 6. TRIGGER 3: SUPER ADMIN USER APPROVAL NOTIFICATION
--    When admin approves a pending citizen account
-- =========================================================
create or replace function public.handle_user_approval_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.approval_status = 'pending' and new.approval_status = 'approved' then
    insert into public.notifications (user_id, type, title, message, subtext)
    values (
      new.id,
      'account_approved',
      'Account Approved!',
      'Your citizen registration has been verified and approved by the Administrator.',
      'You now have full access to report civic infrastructure issues.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_user_approval on public.users;
create trigger trg_notify_user_approval
  after update of approval_status on public.users
  for each row execute function public.handle_user_approval_notification();

-- =========================================================
-- 7. SUPABASE REALTIME PUBLICATION
-- =========================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
