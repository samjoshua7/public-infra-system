-- 005_status_pipeline_rework.sql
-- Run this in Supabase SQL Editor AFTER 001, 002, 003, and 004.
--
-- Replaces the 3-stage status pipeline (posted -> action_taken -> fixed)
-- with a 4-stage one: ordered -> budget_allocated -> on_process -> finished.
-- Also makes a comment/note MANDATORY on every status change, not optional.

-- =========================================================
-- 1. DROP OLD CHECK CONSTRAINTS FIRST — must happen before the data
--    migration below, otherwise writing the new status values would be
--    rejected by the still-active old constraint.
-- =========================================================
alter table public.issue_reports drop constraint if exists issue_reports_status_check;
alter table public.report_status_history drop constraint if exists report_status_history_status_check;

-- =========================================================
-- 2. MIGRATE EXISTING DATA to the new vocabulary.
--    Mapping: posted -> ordered, action_taken -> on_process, fixed -> finished.
--    (budget_allocated is a new intermediate stage with no old equivalent —
--    existing in-progress reports land on 'on_process', which is the closer
--    match than leaving them stuck at the start.)
--
--    The edit-rules trigger (from migration 004) is temporarily disabled
--    for this data migration only — it normally blocks any direct UPDATE
--    to issue_reports.status outside update_report_status().
-- =========================================================
alter table public.issue_reports disable trigger trg_issue_reports_enforce_edit_rules;

update public.issue_reports set status = 'ordered' where status = 'posted';
update public.issue_reports set status = 'on_process' where status = 'action_taken';
update public.issue_reports set status = 'finished' where status = 'fixed';

alter table public.issue_reports enable trigger trg_issue_reports_enforce_edit_rules;

update public.report_status_history set status = 'ordered' where status = 'posted';
update public.report_status_history set status = 'on_process' where status = 'action_taken';
update public.report_status_history set status = 'finished' where status = 'fixed';

-- =========================================================
-- 3. NEW CHECK CONSTRAINTS + DEFAULT — added now that all existing data
--    already conforms to the new vocabulary.
-- =========================================================
alter table public.issue_reports
  add constraint issue_reports_status_check
  check (status in ('ordered', 'budget_allocated', 'on_process', 'finished'));
alter table public.issue_reports alter column status set default 'ordered';

alter table public.report_status_history
  add constraint report_status_history_status_check
  check (status in ('ordered', 'budget_allocated', 'on_process', 'finished'));

-- =========================================================
-- 4. SEED HISTORY ROW ON REPORT CREATION — now 'ordered' instead of 'posted'
-- =========================================================
create or replace function public.handle_new_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.report_status_history (report_id, status, changed_by, note)
  values (new.report_id, 'ordered', new.reporter_id, 'Report submitted');
  return new;
end;
$$;

-- =========================================================
-- 5. STATUS TRANSITION FUNCTION — 4-stage forward-only pipeline,
--    and the note/comment is now REQUIRED (not optional) on every move.
-- =========================================================
-- Must DROP first: Postgres won't let CREATE OR REPLACE remove the old
-- p_note default (it was previously `default null`, now required).
drop function if exists public.update_report_status(uuid, text, text);

create function public.update_report_status(p_report_id uuid, p_new_status text, p_note text)
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

  update public.issue_reports set status = p_new_status, updated_at = now() where report_id = p_report_id;
end;
$$;

-- =========================================================
-- 6. UPDATE EVERY OTHER PLACE THAT REFERENCED THE OLD 'posted' VALUE
-- =========================================================

-- Owner delete: only while still in the first stage
drop policy if exists issue_reports_delete_own_or_admin on public.issue_reports;
create policy issue_reports_delete_own_or_admin on public.issue_reports for delete
  using (
    (reporter_id = auth.uid() and status = 'ordered')
    or public.current_user_role() = 'ADMIN'
  );

-- Owner edit rules: title/description/category only editable in the first stage
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
    if old.status <> 'ordered' and public.current_user_role() <> 'ADMIN' then
      raise exception 'Report details can only be edited while status is ordered';
    end if;
  end if;

  return new;
end;
$$;
