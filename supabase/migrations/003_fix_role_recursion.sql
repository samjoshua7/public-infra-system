-- 003_fix_role_recursion.sql
-- Run this in Supabase SQL Editor AFTER 001 and 002.
--
-- BUG FIXED: public.current_user_role() queried public.users, but was also
-- used INSIDE public.users' own RLS policies (users_select_own_or_admin,
-- users_update_own_or_admin). Whenever a policy had to actually evaluate the
-- "= 'ADMIN'" branch (e.g. an admin listing all users, or any role check on
-- another table that falls through to it), Postgres re-ran the policy on
-- public.users to evaluate the function again, which called the function
-- again — infinite recursion, surfaced as Postgres error 54001
-- "stack depth limit exceeded". This is why normal citizen use (which never
-- needs that branch) looked fine, while the admin panel and anything an
-- official/admin does that isn't just reading their own row broke.
--
-- FIX: mark the function SECURITY DEFINER with a locked search_path, so its
-- internal SELECT runs with the function owner's privileges and bypasses
-- RLS on public.users for that one internal lookup, instead of re-triggering
-- the same policy recursively.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;
