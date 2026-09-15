-- 011_fix_users_rls_and_privacy.sql
-- Run this in Supabase SQL Editor AFTER 010.
--
-- PURPOSE:
-- 1. Fix RLS on public.users so authenticated citizens and visitors can read
--    public author profile info (name, role, anonymous_name, privacy_lock).
--    Previously, users_select_own_or_admin blocked non-admins from reading ANY other user's row,
--    causing report.users to be NULL for citizens, which made every public post show "Citizen" as name
--    and prevented reading the author's dummy alias and account-wide privacy lock.
--
-- 2. Update get_nearby_reports RPC to ensure strict privacy masking:
--    If privacy_lock is enabled on the post OR on the author's account:
--    - reporter_id is hidden (NULL) for everyone except the author.
--    - reporter_name is masked to dummy alias (e.g. LongGiraffe421) for everyone except the author.
--    - reporter_email is hidden (NULL) for everyone except the author.
--    - Even Admins and Government Officials see ONLY the dummy alias for locked reports.
--    If privacy_lock is false:
--    - reporter_name returns coalesce(u.name, 'Citizen') so the actual poster's name is shown.

-- 1. Drop existing select policy on public.users and replace with public profile read policy
drop policy if exists users_select_own_or_admin on public.users;
drop policy if exists users_select_public_profile on public.users;

create policy users_select_public_profile on public.users for select
  using (true);

-- 2. Ensure all existing users have an anonymous_name assigned
update public.users
set anonymous_name = public.generate_anonymous_name()
where anonymous_name is null;

-- 3. Replace get_nearby_reports RPC with strict masking rules
drop function if exists public.get_nearby_reports;

create or replace function public.get_nearby_reports(
  p_user_lat numeric default null,
  p_user_lng numeric default null,
  p_max_radius_km numeric default null,
  p_category text default null,
  p_status text default null,
  p_page int default 1,
  p_page_size int default 10
)
returns table (
  report_id uuid,
  reporter_id uuid,
  photo_url text,
  title text,
  description text,
  category text,
  latitude numeric,
  longitude numeric,
  address text,
  status text,
  is_hidden boolean,
  like_count int,
  comment_count int,
  created_at timestamptz,
  reporter_name text,
  reporter_email text,
  distance_km numeric,
  total_count bigint,
  privacy_lock boolean,
  anonymous_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset int := greatest(0, (coalesce(p_page, 1) - 1) * coalesce(p_page_size, 10));
  v_role text := public.current_user_role();
  v_has_coords boolean := (p_user_lat is not null and p_user_lng is not null);
begin
  return query
  with calculated as (
    select
      r.report_id,
      -- Mask reporter_id if privacy locked and viewer is not the report author
      case
        when (r.privacy_lock = true or coalesce(u.privacy_lock, false) = true) and (auth.uid() is null or auth.uid() <> r.reporter_id) then null
        else r.reporter_id
      end as reporter_id,
      r.photo_url,
      r.title,
      r.description,
      r.category,
      r.latitude,
      r.longitude,
      r.address,
      r.status,
      r.is_hidden,
      r.like_count,
      r.comment_count,
      r.created_at,
      -- Mask reporter_name with dummy alias if privacy locked and viewer is not the report author
      case
        when (r.privacy_lock = true or coalesce(u.privacy_lock, false) = true) and (auth.uid() is null or auth.uid() <> r.reporter_id) then
          coalesce(u.anonymous_name, 'LongGiraffe')
        else
          coalesce(u.name, 'Citizen')
      end as reporter_name,
      -- Mask reporter_email if privacy locked and viewer is not the report author
      case
        when (r.privacy_lock = true or coalesce(u.privacy_lock, false) = true) and (auth.uid() is null or auth.uid() <> r.reporter_id) then
          null
        else
          u.email
      end as reporter_email,
      case
        when v_has_coords then
          round(
            (6371 * acos(
              least(1.0, greatest(-1.0,
                cos(radians(p_user_lat)) * cos(radians(r.latitude)) *
                cos(radians(r.longitude) - radians(p_user_lng)) +
                sin(radians(p_user_lat)) * sin(radians(r.latitude))
              ))
            ))::numeric,
            2
          )
        else null
      end as distance_km,
      case
        when (r.privacy_lock = true or coalesce(u.privacy_lock, false) = true) then true
        else false
      end as privacy_lock,
      coalesce(u.anonymous_name, 'LongGiraffe') as anonymous_name
    from public.issue_reports r
    left join public.users u on u.id = r.reporter_id
    where (
      (r.is_hidden = false or r.reporter_id = auth.uid() or v_role in ('GOVERNMENT_OFFICIAL', 'ADMIN'))
    )
    and (p_category is null or p_category = 'all' or r.category = p_category)
    and (p_status is null or p_status = 'all' or r.status = p_status)
  ),
  filtered as (
    select *
    from calculated
    where (
      not v_has_coords
      or p_max_radius_km is null
      or p_max_radius_km <= 0
      or (distance_km is not null and distance_km <= p_max_radius_km)
    )
  ),
  counted as (
    select count(*) as full_count from filtered
  )
  select
    f.report_id,
    f.reporter_id,
    f.photo_url,
    f.title,
    f.description,
    f.category,
    f.latitude,
    f.longitude,
    f.address,
    f.status,
    f.is_hidden,
    f.like_count,
    f.comment_count,
    f.created_at,
    f.reporter_name,
    f.reporter_email,
    f.distance_km,
    coalesce(c.full_count, 0::bigint) as total_count,
    f.privacy_lock,
    f.anonymous_name
  from filtered f
  cross join counted c
  order by
    case when v_has_coords then f.distance_km end asc nulls last,
    f.created_at desc
  limit coalesce(p_page_size, 10)
  offset v_offset;
end;
$$;
