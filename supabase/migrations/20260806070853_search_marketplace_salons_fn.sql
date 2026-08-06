-- Scalable marketplace salon search (bounding box + haversine).

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
      (
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
