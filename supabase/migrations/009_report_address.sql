-- 009_report_address.sql
-- Run this in Supabase SQL Editor AFTER 001 through 008.
--
-- 1. Add human-readable address column to issue_reports
alter table public.issue_reports
  add column if not exists address text;

-- 2. Update get_nearby_reports RPC to return the address column
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
  total_count bigint
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
      r.reporter_id,
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
      coalesce(u.name, 'Citizen') as reporter_name,
      u.email as reporter_email,
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
      end as distance_km
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
    coalesce(c.full_count, 0::bigint) as total_count
  from filtered f
  cross join counted c
  order by
    case when v_has_coords then f.distance_km end asc nulls last,
    f.created_at desc
  limit coalesce(p_page_size, 10)
  offset v_offset;
end;
$$;
