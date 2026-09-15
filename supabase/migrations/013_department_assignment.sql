-- 013_department_assignment.sql
-- Run this in Supabase SQL Editor AFTER 012.
--
-- PURPOSE: Add department-based access control for government officials.
-- Officials are assigned specific categories (departments) and can only
-- change the status of reports within their assigned departments.
-- A "Super Official" with assigned_departments = {'all'} can manage everything.

-- 1. Add assigned_departments column to public.users
--    Empty array = no departments assigned (cannot manage any reports)
--    {'all'} = Super Official (can manage ALL categories)
--    {'pothole', 'streetlight'} = can only manage those specific categories
alter table public.users
  add column if not exists assigned_departments text[] not null default '{}';

-- 2. Backfill existing GOVERNMENT_OFFICIAL users with 'all' so they keep working
update public.users
set assigned_departments = '{all}'
where role = 'GOVERNMENT_OFFICIAL'
  and (assigned_departments = '{}' or assigned_departments is null);

-- 3. Backfill ADMIN users with 'all' as well (admins bypass this check anyway,
--    but it keeps the data consistent for display purposes)
update public.users
set assigned_departments = '{all}'
where role = 'ADMIN'
  and (assigned_departments = '{}' or assigned_departments is null);

-- 4. Replace update_report_status() RPC with department enforcement
create or replace function public.update_report_status(p_report_id uuid, p_new_status text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_current_status text;
  v_report_category text;
  v_role text;
  v_departments text[];
begin
  v_role := public.current_user_role();
  if v_role not in ('GOVERNMENT_OFFICIAL', 'ADMIN') then
    raise exception 'Only government officials or admins can update report status';
  end if;

  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'A comment is required when changing report status';
  end if;

  select status, category into v_current_status, v_report_category
  from public.issue_reports where report_id = p_report_id;

  if v_current_status is null then
    raise exception 'Report not found';
  end if;

  -- Department enforcement: officials can only manage reports in their assigned departments
  if v_role = 'GOVERNMENT_OFFICIAL' then
    select assigned_departments into v_departments
    from public.users where id = auth.uid();

    -- If departments is null or empty, block
    if v_departments is null or array_length(v_departments, 1) is null then
      raise exception 'You have no departments assigned. Contact your administrator.';
    end if;

    -- If 'all' is NOT in their departments, check if the report's category matches
    if not ('all' = any(v_departments)) then
      if not (v_report_category = any(v_departments)) then
        raise exception 'You are not assigned to the "%" department. You can only manage reports in your assigned departments.', v_report_category;
      end if;
    end if;
  end if;
  -- ADMIN role bypasses department check entirely

  if not (
    (v_current_status = 'ordered' and p_new_status = 'budget_allocated')
    or (v_current_status = 'budget_allocated' and p_new_status = 'on_process')
    or (v_current_status = 'on_process' and p_new_status = 'finished')
  ) then
    raise exception 'Invalid status transition from % to %', v_current_status, p_new_status;
  end if;

  insert into public.report_status_history (report_id, status, changed_by, note)
  values (p_report_id, p_new_status, auth.uid(), p_note);

  -- flag scoped to this transaction only (third arg `true` = is_local)
  perform set_config('app.status_update_in_progress', 'true', true);
  update public.issue_reports set status = p_new_status, updated_at = now() where report_id = p_report_id;
end;
$$;
