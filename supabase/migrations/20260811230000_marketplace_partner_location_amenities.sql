-- Partner map location + amenities for Marketplace search (additive).

alter table public.marketplace_partners
  add column if not exists address text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists amenities text[] not null default '{}';

comment on column public.marketplace_partners.amenities is
  'Canonical English amenity flags, e.g. disability_accessible, kids_care, parking.';

comment on column public.marketplace_partners.latitude is
  'Optional map pin latitude for Marketplace search results.';

create index if not exists marketplace_partners_amenities_gin
  on public.marketplace_partners using gin (amenities);

-- Refresh catalog RPC to include map + amenity fields.
create or replace function public.load_marketplace_matching_catalog()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(partner_row order by partner_row ->> 'display_name')
      from (
        select jsonb_build_object(
          'id', mp.id,
          'display_name', mp.display_name,
          'partner_type', mp.partner_type,
          'status', mp.status,
          'is_demo', mp.is_demo,
          'bio', mp.bio,
          'address', mp.address,
          'latitude', mp.latitude,
          'longitude', mp.longitude,
          'amenities', coalesce(to_jsonb(mp.amenities), '[]'::jsonb),
          'services', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', ps.id,
              'partner_id', ps.partner_id,
              'category_slug', ps.category_slug,
              'name', ps.name,
              'pricing_type', ps.pricing_type,
              'price_cents', ps.price_cents,
              'price_max_cents', ps.price_max_cents,
              'currency', ps.currency,
              'duration_minutes', ps.duration_minutes,
              'attributes', ps.attributes,
              'is_active', ps.is_active
            ) order by ps.name)
            from public.partner_services ps
            where ps.partner_id = mp.id
          ), '[]'::jsonb),
          'areas', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', pa.id,
              'partner_id', pa.partner_id,
              'service_id', pa.service_id,
              'mode', pa.mode,
              'suburb_id', pa.suburb_id,
              'center_lat', pa.center_lat,
              'center_lng', pa.center_lng,
              'radius_km', pa.radius_km,
              'postcodes', pa.postcodes
            ))
            from public.partner_service_areas pa
            where pa.partner_id = mp.id
          ), '[]'::jsonb),
          'availability', (
            select jsonb_build_object(
              'id', ar.id,
              'partner_id', ar.partner_id,
              'timezone', ar.timezone,
              'weekly_windows', ar.weekly_windows,
              'blackouts', ar.blackouts,
              'capacity_per_slot', ar.capacity_per_slot
            )
            from public.partner_availability_rules ar
            where ar.partner_id = mp.id
            limit 1
          )
        ) as partner_row
        from public.marketplace_partners mp
        where mp.status = 'active'
      ) catalog
    ),
    '[]'::jsonb
  );
$$;
