-- Marketplace data foundation: categories, suburbs, salon FKs.
-- Note: tenant `staff` already exists — marketplace staff lives in `salon_staff`.
-- Marketplace services live in `salon_services` (no top-level `services` table).

create table if not exists public.business_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists business_categories_slug_idx
  on public.business_categories (slug);

alter table public.business_categories enable row level security;

drop policy if exists "Public can read business categories" on public.business_categories;
create policy "Public can read business categories"
  on public.business_categories for select to anon, authenticated
  using (true);

create table if not exists public.suburbs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  postcode text,
  city text not null default 'Brisbane',
  state text not null default 'QLD',
  country text not null default 'Australia',
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  unique (name, city, state)
);

create index if not exists suburbs_name_idx on public.suburbs (name);
create index if not exists suburbs_geo_idx on public.suburbs (latitude, longitude);

alter table public.suburbs enable row level security;

drop policy if exists "Public can read suburbs" on public.suburbs;
create policy "Public can read suburbs"
  on public.suburbs for select to anon, authenticated
  using (true);

-- Seed categories (idempotent)
insert into public.business_categories (name, slug, icon, sort_order)
select v.name, v.slug, v.icon, v.sort_order
from (values
  ('Hair', 'hair', 'scissors', 0),
  ('Nails', 'nails', 'sparkles', 1),
  ('Spa', 'spa', 'lotus', 2),
  ('Barber', 'barber', 'razor', 3),
  ('Massage', 'massage', 'hand', 4),
  ('Facial', 'facial', 'sparkle', 5),
  ('Waxing', 'waxing', 'droplet', 6)
) as v(name, slug, icon, sort_order)
where not exists (
  select 1 from public.business_categories c where c.slug = v.slug
);

-- Seed Brisbane suburbs
insert into public.suburbs (name, postcode, city, state, country, latitude, longitude)
select v.name, v.postcode, 'Brisbane', 'QLD', 'Australia', v.lat, v.lng
from (values
  ('Aspley', '4034', -27.3632::float8, 153.0164::float8),
  ('Chermside', '4032', -27.3849::float8, 153.0312::float8),
  ('Sunnybank', '4109', -27.5704::float8, 153.0608::float8),
  ('Indooroopilly', '4068', -27.4992::float8, 152.9726::float8),
  ('Carindale', '4152', -27.5030::float8, 153.1020::float8),
  ('Paddington', '4064', -27.4590::float8, 152.9990::float8),
  ('New Farm', '4005', -27.4676::float8, 153.0489::float8),
  ('Fortitude Valley', '4006', -27.4570::float8, 153.0350::float8),
  ('North Lakes', '4509', -27.2400::float8, 153.0160::float8),
  ('Albany Creek', '4035', -27.3480::float8, 152.9680::float8),
  ('Kedron', '4031', -27.4050::float8, 153.0280::float8),
  ('Nundah', '4012', -27.4020::float8, 153.0580::float8),
  ('Toowong', '4066', -27.4850::float8, 152.9920::float8),
  ('West End', '4101', -27.4810::float8, 153.0130::float8),
  ('South Brisbane', '4101', -27.4750::float8, 153.0170::float8),
  ('Wynnum', '4178', -27.4430::float8, 153.1760::float8),
  ('Capalaba', '4157', -27.5230::float8, 153.1920::float8),
  ('Mount Gravatt', '4122', -27.5380::float8, 153.0780::float8),
  ('Garden City', '4122', -27.5620::float8, 153.0820::float8),
  ('Mitchelton', '4053', -27.4160::float8, 152.9760::float8)
) as v(name, postcode, lat, lng)
where not exists (
  select 1 from public.suburbs s
  where s.name = v.name and s.city = 'Brisbane' and s.state = 'QLD'
);

alter table public.salons
  add column if not exists category_id uuid references public.business_categories (id),
  add column if not exists suburb_id uuid references public.suburbs (id),
  add column if not exists price_min integer,
  add column if not exists price_max integer;

create index if not exists salons_category_id_idx on public.salons (category_id);
create index if not exists salons_suburb_id_idx on public.salons (suburb_id);
create index if not exists salons_category_geo_idx
  on public.salons (category_id, latitude, longitude);
create index if not exists salons_slug_category_idx
  on public.salons (slug);

-- Backfill category_id from primary_service / marketplace category labels
update public.salons s
set category_id = c.id
from public.business_categories c
where s.category_id is null
  and (
    lower(coalesce(s.primary_service, '')) = lower(c.name)
    or lower(coalesce(s.primary_service, '')) = c.slug
  );

-- Facial / Waxing / Spa fallbacks
update public.salons s
set category_id = c.id
from public.business_categories c
where s.category_id is null
  and c.slug = 'spa'
  and lower(coalesce(s.primary_service, '')) in ('spa');

-- Backfill suburb_id from suburb name
update public.salons s
set suburb_id = sub.id
from public.suburbs sub
where s.suburb_id is null
  and lower(coalesce(s.suburb, '')) = lower(sub.name);

-- Price range from starting_price when missing
update public.salons
set
  price_min = coalesce(price_min, starting_price),
  price_max = coalesce(price_max, starting_price + 80)
where price_min is null or price_max is null;
