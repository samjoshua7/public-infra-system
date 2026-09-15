-- 010_privacy_lock.sql
-- Run this in Supabase SQL Editor AFTER 001 through 009.
--
-- 1. Add privacy_lock and anonymous_name columns to public.users
alter table public.users
  add column if not exists anonymous_name text,
  add column if not exists privacy_lock boolean not null default false;

-- 2. Add privacy_lock and address columns to public.issue_reports
alter table public.issue_reports
  add column if not exists address text,
  add column if not exists privacy_lock boolean not null default false;

-- 3. Function to generate random dummy aliases (e.g. LongGiraffe421, SwiftFox302)
create or replace function public.generate_anonymous_name()
returns text
language plpgsql
as $$
declare
  adjectives text[] := array[
    'Long', 'Swift', 'Silent', 'Clever', 'Cosmic', 'Brave', 'Mighty', 
    'Happy', 'Hyper', 'Quiet', 'Neon', 'Lucky', 'Golden', 'Shadow', 
    'Silver', 'Wild', 'Chill', 'Mystic', 'Noble', 'Turbo'
  ];
  animals text[] := array[
    'Giraffe', 'Otter', 'Falcon', 'Penguin', 'Badger', 'Koala', 'Moose',
    'Fox', 'Panda', 'Cheetah', 'Owl', 'Tiger', 'Dolphin', 'Wolf',
    'Hawk', 'Beaver', 'Rabbit', 'Eagle', 'Leopard', 'Panther'
  ];
  adj text;
  anim text;
  num int;
begin
  adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
  anim := animals[1 + floor(random() * array_length(animals, 1))::int];
  num := floor(random() * 900 + 100)::int;
  return adj || anim || num;
end;
$$;

-- 4. Backfill existing users who do not have an anonymous_name yet
update public.users
set anonymous_name = public.generate_anonymous_name()
where anonymous_name is null;

-- 5. Update handle_new_user() trigger to assign anonymous_name to future sign-ups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role, name, email, anonymous_name, privacy_lock)
  values (
    new.id,
    'CITIZEN',
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    public.generate_anonymous_name(),
    false
  );
  return new;
end;
$$;

-- 6. Update get_nearby_reports RPC to enforce privacy masking at the database level
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
      -- Mask reporter_id if privacy locked and viewer is not the report owner
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
      -- Mask reporter_name with dummy alias if privacy locked and viewer is not the report owner
      case
        when (r.privacy_lock = true or coalesce(u.privacy_lock, false) = true) and (auth.uid() is null or auth.uid() <> r.reporter_id) then
          coalesce(u.anonymous_name, 'LongGiraffe')
        else
          coalesce(u.name, 'Citizen')
      end as reporter_name,
      -- Mask reporter_email if privacy locked and viewer is not the report owner
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
