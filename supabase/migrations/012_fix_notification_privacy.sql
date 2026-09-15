-- 012_fix_notification_privacy.sql
-- Run this in Supabase SQL Editor AFTER 011.
--
-- BUG FIXED: handle_new_report_notification() always used the reporter's
-- real name in the notification message, leaking their identity even when
-- Privacy Lock was enabled on the report or on the user's account.
--
-- FIX: Check both report-level privacy_lock (new.privacy_lock) and
-- account-level privacy_lock (users.privacy_lock). If either is true,
-- use the anonymous_name (e.g. "LongGiraffe421") instead of the real name.

-- 1. Replace the new-report notification trigger function
create or replace function public.handle_new_report_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_reporter_name text;
  v_reporter_privacy boolean;
  v_reporter_anonymous text;
  v_display_name text;
  v_category_name text;
begin
  -- Fetch reporter's real name, account-wide privacy lock, and anonymous alias
  select
    coalesce(name, 'A citizen'),
    coalesce(privacy_lock, false),
    coalesce(anonymous_name, 'A citizen')
  into v_reporter_name, v_reporter_privacy, v_reporter_anonymous
  from public.users where id = new.reporter_id;

  -- Determine display name: use dummy alias if post or account privacy lock is active
  if new.privacy_lock = true or v_reporter_privacy = true then
    v_display_name := v_reporter_anonymous;
  else
    v_display_name := v_reporter_name;
  end if;

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
    format('%s reported a %s: "%s"', v_display_name, v_category_name, new.title),
    'In your community',
    new.report_id
  from public.users u
  where u.id <> new.reporter_id
    and u.active = true
    and u.approval_status = 'approved';

  return new;
end;
$$;

-- 2. Scrub existing notification messages that leaked real names for privacy-locked reports.
--    Replace the reporter's real name with their anonymous_name in past notification messages.
update public.notifications n
set message = format('%s reported a %s: "%s"',
  coalesce(u.anonymous_name, 'A citizen'),
  case r.category
    when 'pothole' then 'Pothole'
    when 'streetlight' then 'Broken Streetlight'
    when 'traffic_light' then 'Traffic Light'
    when 'garbage' then 'Garbage'
    else 'Infrastructure Issue'
  end,
  r.title
)
from public.issue_reports r
join public.users u on u.id = r.reporter_id
where n.report_id = r.report_id
  and n.type = 'new_report'
  and (r.privacy_lock = true or u.privacy_lock = true);
