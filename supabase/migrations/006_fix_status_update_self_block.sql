-- 006_fix_status_update_self_block.sql
-- Run this in Supabase SQL Editor AFTER 001-005.
--
-- BUG: update_report_status() performs its own internal UPDATE on
-- issue_reports.status. That UPDATE fires the trg_issue_reports_enforce_edit_rules
-- trigger (from migration 004), whose enforce_report_edit_rules() function
-- unconditionally raises "Status can only be changed via update_report_status()"
-- whenever status changes — with no way to tell "this IS that function calling
-- itself" apart from any other caller. So the function was blocking itself,
-- every time, since migration 004 was applied.
--
-- FIX: use a transaction-local session flag. update_report_status() sets it
-- right before its internal UPDATE; the trigger only raises when the flag is
-- NOT set. This is safe under concurrency (the flag is scoped to the single
-- transaction/call, not global) and avoids disabling/re-enabling the trigger
-- on every call, which would take a heavier table lock than necessary.

create or replace function public.enforce_report_edit_rules()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if coalesce(current_setting('app.status_update_in_progress', true), 'false') <> 'true' then
      raise exception 'Status can only be changed via update_report_status()';
    end if;
  end if;

  if (
    new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.category is distinct from old.category
    or new.photo_url is distinct from old.photo_url
  ) then
    if old.status <> 'ordered' and public.current_user_role() <> 'ADMIN' then
      raise exception 'Report details can only be edited while status is ordered';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.update_report_status(p_report_id uuid, p_new_status text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_current_status text;
  v_role text;
begin
  v_role := public.current_user_role();
  if v_role not in ('GOVERNMENT_OFFICIAL', 'ADMIN') then
    raise exception 'Only government officials or admins can update report status';
  end if;

  if p_note is null or length(trim(p_note)) = 0 then
    raise exception 'A comment is required when changing report status';
  end if;

  select status into v_current_status from public.issue_reports where report_id = p_report_id;

  if v_current_status is null then
    raise exception 'Report not found';
  end if;

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
