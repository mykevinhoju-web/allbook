-- Search-time Google auto-import: area coverage + exclude synthetics from search.

create table if not exists public.search_area_coverage (
  id uuid primary key default gen_random_uuid(),
  area_key text not null unique,
  category_slug text not null,
  location_label text,
  latitude double precision not null,
  longitude double precision not null,
  radius_km double precision not null default 20,
  last_fetched_at timestamptz,
  last_status text not null default 'pending'
    check (last_status in ('pending', 'ok', 'failed', 'skipped')),
  imported_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists search_area_coverage_fetched_idx
  on public.search_area_coverage (last_fetched_at desc);

create table if not exists public.search_google_import_runs (
  id uuid primary key default gen_random_uuid(),
  area_key text not null,
  category_slug text not null,
  location_label text,
  latitude double precision,
  longitude double precision,
  radius_km double precision,
  queried integer not null default 0,
  imported integer not null default 0,
  updated integer not null default 0,
  skipped integer not null default 0,
  failed integer not null default 0,
  status text not null default 'ok'
    check (status in ('ok', 'failed', 'partial')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists search_google_import_runs_created_idx
  on public.search_google_import_runs (created_at desc);

create index if not exists search_google_import_runs_area_idx
  on public.search_google_import_runs (area_key, created_at desc);

alter table public.search_area_coverage enable row level security;
alter table public.search_google_import_runs enable row level security;
-- Service-role only (no anon policies).

comment on table public.search_area_coverage is
  'Tracks Google Places fill per search area+category. Stale/missing rows trigger auto-import.';
comment on table public.search_google_import_runs is
  'Audit log for search-triggered Google imports (imported/updated/skipped/failed).';

-- Exclude synthetic/demo businesses from marketplace search.
create or replace function public.search_marketplace_salons(
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km double precision default null,
  p_service text default null,
  p_services text[] default null,
  p_suburb text default null,
  p_sort text default 'distance',
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  description text,
  phone text,
  email text,
  website text,
  cover_image text,
  logo text,
  address text,
  suburb text,
  city text,
  state text,
  postcode text,
  country text,
  latitude double precision,
  longitude double precision,
  rating numeric,
  review_count integer,
  verified boolean,
  primary_service text,
  starting_price integer,
  slug text,
  created_at timestamptz,
  updated_at timestamptz,
  distance_km double precision
)
language sql
stable
security invoker
as $$
  with bounds as (
    select
      p_lat as lat,
      p_lng as lng,
      p_radius_km as radius_km,
      case
        when p_lat is null or p_lng is null or p_radius_km is null then null
        else p_radius_km / 111.32
      end as lat_delta,
      case
        when p_lat is null or p_lng is null or p_radius_km is null then null
        else p_radius_km / (111.32 * greatest(cos(radians(p_lat)), 0.01))
      end as lng_delta
  ),
  filtered as (
    select
      s.*,
      b.radius_km as filter_radius_km,
      case
        when b.lat is null or b.lng is null then null::double precision
        else (
          6371 * acos(
            least(
              1.0,
              greatest(
                -1.0,
                cos(radians(b.lat))
                  * cos(radians(s.latitude))
                  * cos(radians(s.longitude) - radians(b.lng))
                  + sin(radians(b.lat)) * sin(radians(s.latitude))
              )
            )
          )
        )
      end as computed_distance_km
    from public.salons s
    cross join bounds b
    where
      coalesce(s.marketplace_visible, true) = true
      and coalesce(s.permanently_closed, false) = false
      and coalesce(s.is_synthetic, false) = false
      and (
        p_suburb is null
        or btrim(p_suburb) = ''
        or s.suburb ilike ('%' || btrim(p_suburb) || '%')
        or s.city ilike ('%' || btrim(p_suburb) || '%')
        or s.name ilike ('%' || btrim(p_suburb) || '%')
        or coalesce(s.address, '') ilike ('%' || btrim(p_suburb) || '%')
      )
      and (
        (p_services is null and (p_service is null or btrim(p_service) = ''))
        or (p_services is not null and s.primary_service = any (p_services))
        or (
          p_service is not null
          and btrim(p_service) <> ''
          and s.primary_service ilike btrim(p_service)
        )
      )
      and (
        b.lat is null
        or b.lng is null
        or b.radius_km is null
        or (
          s.latitude between (b.lat - b.lat_delta) and (b.lat + b.lat_delta)
          and s.longitude between (b.lng - b.lng_delta) and (b.lng + b.lng_delta)
        )
      )
  )
  select
    f.id,
    f.name,
    f.description,
    f.phone,
    f.email,
    f.website,
    f.cover_image,
    f.logo,
    f.address,
    f.suburb,
    f.city,
    f.state,
    f.postcode,
    f.country,
    f.latitude,
    f.longitude,
    f.rating,
    f.review_count,
    f.verified,
    f.primary_service,
    f.starting_price,
    f.slug,
    f.created_at,
    f.updated_at,
    f.computed_distance_km as distance_km
  from filtered f
  where
    f.filter_radius_km is null
    or f.computed_distance_km is null
    or f.computed_distance_km <= f.filter_radius_km
  order by
    case when p_sort = 'distance' and f.computed_distance_km is not null then f.computed_distance_km end asc nulls last,
    case when p_sort = 'rating' then f.rating end desc nulls last,
    case when p_sort = 'price' then f.starting_price end asc nulls last,
    case when p_sort = 'newest' then extract(epoch from f.created_at) end desc nulls last,
    f.rating desc,
    f.name asc
  limit greatest(coalesce(p_limit, 100), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.search_marketplace_salons(
  double precision,
  double precision,
  double precision,
  text,
  text[],
  text,
  text,
  integer,
  integer
) to anon, authenticated;
