-- Sprint 2 — Google catalogue integrity + future search attributes.
-- Does NOT delete synthetic businesses; marks them for ops review.

-- ---------------------------------------------------------------------------
-- 1) Future search / filter attributes (owner or enrichment filled later)
-- ---------------------------------------------------------------------------

alter table public.salons
  add column if not exists search_keywords text[] not null default '{}',
  add column if not exists search_styles text[] not null default '{}',
  add column if not exists search_brands text[] not null default '{}',
  add column if not exists search_techniques text[] not null default '{}',
  add column if not exists search_features text[] not null default '{}',
  add column if not exists price_tier text,
  add column if not exists is_synthetic boolean not null default false;

comment on column public.salons.search_keywords is
  'Free-text search tokens (owner / enrichment). Not populated from Google import.';
comment on column public.salons.search_styles is
  'Style tags for future filters (e.g. balayage, korean).';
comment on column public.salons.search_brands is
  'Product/brand tags for future filters.';
comment on column public.salons.search_techniques is
  'Technique tags for future filters.';
comment on column public.salons.search_features is
  'Feature flags beyond amenities (e.g. late_night, kids_friendly).';
comment on column public.salons.price_tier is
  'Optional price band for future filters (e.g. budget | mid | premium).';
comment on column public.salons.is_synthetic is
  'True for seeded/demo businesses without a real Google Place ID. Do not treat as live catalogue.';
comment on column public.salons.amenities is
  'Amenity tags for future filters (wifi, parking, …).';
comment on column public.salons.starting_price is
  'Lowest listed service price (cents/AUD dollars per product convention) for future price filters.';

-- Availability remains booking-engine derived; store preference only.
alter table public.salons
  add column if not exists search_availability_mode text not null default 'unknown';

comment on column public.salons.search_availability_mode is
  'Future availability filter hint: unknown | walk_in | appointment | both. Not live inventory.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'salons_price_tier_check'
  ) then
    alter table public.salons
      add constraint salons_price_tier_check
      check (
        price_tier is null
        or price_tier in ('budget', 'mid', 'premium', 'luxury')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'salons_search_availability_mode_check'
  ) then
    alter table public.salons
      add constraint salons_search_availability_mode_check
      check (
        search_availability_mode in ('unknown', 'walk_in', 'appointment', 'both')
      );
  end if;
end $$;

create index if not exists salons_search_keywords_gin
  on public.salons using gin (search_keywords);
create index if not exists salons_search_styles_gin
  on public.salons using gin (search_styles);
create index if not exists salons_search_brands_gin
  on public.salons using gin (search_brands);
create index if not exists salons_search_techniques_gin
  on public.salons using gin (search_techniques);
create index if not exists salons_search_features_gin
  on public.salons using gin (search_features);
create index if not exists salons_amenities_gin
  on public.salons using gin (amenities);
create index if not exists salons_is_synthetic_idx
  on public.salons (is_synthetic)
  where is_synthetic = true;
create index if not exists salons_price_tier_idx
  on public.salons (price_tier)
  where price_tier is not null;

-- Reaffirm Google Place ID uniqueness (import identity).
create unique index if not exists salons_google_place_id_uidx
  on public.salons (google_place_id)
  where google_place_id is not null;

-- ---------------------------------------------------------------------------
-- 2) Mark existing synthetic / demo catalogue rows (no deletes)
-- ---------------------------------------------------------------------------

update public.salons
set
  is_synthetic = true,
  updated_at = now()
where google_place_id is null
  and coalesce(source, 'manual') <> 'google';
