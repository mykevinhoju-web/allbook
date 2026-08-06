-- Marketplace directory salons (platform search / maps).
-- Note: tenant `staff` and `bookings` already exist — do not redefine them.
-- Future marketplace tables (reviews, favorites, salon_services) can FK to salons.id.

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  phone text,
  email text,
  website text,
  cover_image text,
  logo text,
  address text,
  suburb text,
  city text not null default 'Brisbane',
  state text not null default 'QLD',
  postcode text,
  country text not null default 'Australia',
  latitude double precision not null,
  longitude double precision not null,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  verified boolean not null default false,
  -- Search card fields until salon_services is wired
  primary_service text,
  starting_price integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salons_suburb_idx on public.salons (suburb);
create index if not exists salons_primary_service_idx on public.salons (primary_service);
create index if not exists salons_geo_idx on public.salons (latitude, longitude);

alter table public.salons enable row level security;

-- Public marketplace read
drop policy if exists "Public can read salons" on public.salons;
create policy "Public can read salons"
  on public.salons
  for select
  to anon, authenticated
  using (true);

-- Service role / platform admins manage rows via service key (no public write)

-- Seed Brisbane marketplace salons (idempotent by name+suburb)
insert into public.salons (
  name, description, phone, email, website,
  cover_image, logo, address, suburb, city, state, postcode, country,
  latitude, longitude, rating, review_count, verified,
  primary_service, starting_price
)
select * from (values
  (
    'Glow Hair Studio',
    'Colour and cut studio in Aspley.',
    '+61 7 3000 1001',
    'hello@glowhair.example',
    'https://example.com/glow-hair',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    null,
    '142 Gympie Rd',
    'Aspley',
    'Brisbane',
    'QLD',
    '4034',
    'Australia',
    -27.3632::float8,
    153.0164::float8,
    4.9::numeric,
    312,
    true,
    'Hair',
    65
  ),
  (
    'Bella Nails',
    'Nail art and manicures in Chermside.',
    '+61 7 3000 1002',
    'hello@bellanails.example',
    'https://example.com/bella-nails',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    null,
    '18 Hamilton Rd',
    'Chermside',
    'Brisbane',
    'QLD',
    '4032',
    'Australia',
    -27.3849::float8,
    153.0312::float8,
    4.8::numeric,
    198,
    true,
    'Nails',
    45
  ),
  (
    'Luxe Beauty',
    'Facials and beauty treatments in Sunnybank.',
    '+61 7 3000 1003',
    'hello@luxebeauty.example',
    'https://example.com/luxe-beauty',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    null,
    '7 Mains Rd',
    'Sunnybank',
    'Brisbane',
    'QLD',
    '4109',
    'Australia',
    -27.5704::float8,
    153.0608::float8,
    4.7::numeric,
    156,
    true,
    'Facial',
    89
  ),
  (
    'Pure Spa',
    'Massage and spa rituals in Indooroopilly.',
    '+61 7 3000 1004',
    'hello@purespa.example',
    'https://example.com/pure-spa',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    null,
    '55 Indooroopilly Shopping Centre',
    'Indooroopilly',
    'Brisbane',
    'QLD',
    '4068',
    'Australia',
    -27.4992::float8,
    152.9726::float8,
    4.8::numeric,
    240,
    true,
    'Spa',
    110
  ),
  (
    'Urban Barber',
    'Modern cuts and fades in New Farm.',
    '+61 7 3000 1005',
    'hello@urbanbarber.example',
    'https://example.com/urban-barber',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    null,
    '3 Brunswick St',
    'New Farm',
    'Brisbane',
    'QLD',
    '4005',
    'Australia',
    -27.4676::float8,
    153.0489::float8,
    4.6::numeric,
    134,
    true,
    'Barber',
    40
  )
) as v(
  name, description, phone, email, website,
  cover_image, logo, address, suburb, city, state, postcode, country,
  latitude, longitude, rating, review_count, verified,
  primary_service, starting_price
)
where not exists (
  select 1 from public.salons s
  where s.name = v.name and s.suburb = v.suburb
);

-- Marketplace favorites (profiles already exist via auth)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, salon_id)
);

alter table public.favorites enable row level security;

drop policy if exists "Users read own favorites" on public.favorites;
create policy "Users read own favorites"
  on public.favorites for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own favorites" on public.favorites;
create policy "Users insert own favorites"
  on public.favorites for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own favorites" on public.favorites;
create policy "Users delete own favorites"
  on public.favorites for delete to authenticated
  using (auth.uid() = user_id);

-- Marketplace reviews (distinct from tenant booking flow)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  rating numeric(2, 1) not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_salon_id_idx on public.reviews (salon_id);

alter table public.reviews enable row level security;

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
  on public.reviews for select to anon, authenticated
  using (true);
