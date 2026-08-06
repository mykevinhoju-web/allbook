-- Salon detail: amenities, hours, gallery, services, staff, richer reviews.

alter table public.salons
  add column if not exists amenities text[] not null default '{}',
  add column if not exists service_tags text[] not null default '{}',
  add column if not exists opening_hours jsonb not null default '{}'::jsonb;

create table if not exists public.salon_images (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists salon_images_salon_id_idx on public.salon_images (salon_id, sort_order);

alter table public.salon_images enable row level security;

drop policy if exists "Public can read salon images" on public.salon_images;
create policy "Public can read salon images"
  on public.salon_images for select to anon, authenticated
  using (true);

create table if not exists public.salon_services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  category text not null,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price integer not null check (price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salon_services_salon_id_idx
  on public.salon_services (salon_id, category, sort_order);

alter table public.salon_services enable row level security;

drop policy if exists "Public can read salon services" on public.salon_services;
create policy "Public can read salon services"
  on public.salon_services for select to anon, authenticated
  using (is_active = true);

create table if not exists public.salon_staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  name text not null,
  position text not null,
  photo_url text,
  years_experience integer not null default 0 check (years_experience >= 0),
  languages text[] not null default '{}',
  specialties text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salon_staff_salon_id_idx
  on public.salon_staff (salon_id, sort_order);

alter table public.salon_staff enable row level security;

drop policy if exists "Public can read salon staff" on public.salon_staff;
create policy "Public can read salon staff"
  on public.salon_staff for select to anon, authenticated
  using (is_active = true);

alter table public.reviews
  add column if not exists author_name text,
  add column if not exists author_avatar text,
  add column if not exists images text[] not null default '{}',
  add column if not exists like_count integer not null default 0;

-- Default hours template (Mon–Sat open, Sun closed)
create or replace function public.default_salon_opening_hours()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'mon', jsonb_build_object('open', '09:00', 'close', '18:00', 'closed', false),
    'tue', jsonb_build_object('open', '09:00', 'close', '18:00', 'closed', false),
    'wed', jsonb_build_object('open', '09:00', 'close', '18:00', 'closed', false),
    'thu', jsonb_build_object('open', '09:00', 'close', '20:00', 'closed', false),
    'fri', jsonb_build_object('open', '09:00', 'close', '18:00', 'closed', false),
    'sat', jsonb_build_object('open', '09:00', 'close', '17:00', 'closed', false),
    'sun', jsonb_build_object('open', '10:00', 'close', '16:00', 'closed', true)
  );
$$;

-- Enrich salon profile fields
update public.salons s
set
  amenities = case s.name
    when 'Glow Hair Studio' then array['wifi','parking','wheelchair','coffee','air_conditioning']
    when 'Bella Nails' then array['wifi','parking','air_conditioning']
    when 'Luxe Beauty' then array['wifi','parking','wheelchair','coffee','air_conditioning']
    when 'Pure Spa' then array['wifi','parking','wheelchair','coffee','air_conditioning']
    when 'Urban Barber' then array['wifi','parking','air_conditioning']
    else array['wifi','parking']
  end,
  service_tags = case s.name
    when 'Glow Hair Studio' then array['Hair','Colour','Treatment','Blow Dry']
    when 'Bella Nails' then array['Nails','Manicure','Pedicure','Nail Art']
    when 'Luxe Beauty' then array['Facial','Waxing','Brows','Lashes']
    when 'Pure Spa' then array['Spa','Massage','Facial']
    when 'Urban Barber' then array['Barber','Hair','Beard']
    else coalesce(array[s.primary_service], '{}')
  end,
  opening_hours = public.default_salon_opening_hours(),
  description = coalesce(
    nullif(s.description, ''),
    'Premium beauty and wellness care with experienced specialists.'
  ),
  logo = coalesce(
    s.logo,
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=200&q=80'
  )
where true;

-- Gallery images (idempotent by salon + url)
insert into public.salon_images (salon_id, url, alt, sort_order)
select s.id, v.url, v.alt, v.sort_order
from public.salons s
join (
  values
    ('Glow Hair Studio', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80', 'Salon interior', 0),
    ('Glow Hair Studio', 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80', 'Colour station', 1),
    ('Glow Hair Studio', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80', 'Styling', 2),
    ('Glow Hair Studio', 'https://images.unsplash.com/photo-1595476108010-b4d1e1023910?auto=format&fit=crop&w=1200&q=80', 'Products', 3),
    ('Bella Nails', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80', 'Nail studio', 0),
    ('Bella Nails', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80', 'Manicure', 1),
    ('Bella Nails', 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1200&q=80', 'Nail art', 2),
    ('Luxe Beauty', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80', 'Treatment room', 0),
    ('Luxe Beauty', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80', 'Facial', 1),
    ('Pure Spa', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80', 'Spa room', 0),
    ('Pure Spa', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'Massage', 1),
    ('Pure Spa', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'Relaxation', 2),
    ('Urban Barber', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80', 'Barber chairs', 0),
    ('Urban Barber', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80', 'Fade detail', 1)
) as v(salon_name, url, alt, sort_order) on s.name = v.salon_name
where not exists (
  select 1 from public.salon_images i
  where i.salon_id = s.id and i.url = v.url
);

-- Services
insert into public.salon_services (salon_id, category, name, description, duration_minutes, price, sort_order)
select s.id, v.category, v.name, v.description, v.duration_minutes, v.price, v.sort_order
from public.salons s
join (
  values
    ('Glow Hair Studio', 'Hair', 'Women''s Cut & Style', 'Consultation, cut and blow dry.', 60, 85, 0),
    ('Glow Hair Studio', 'Hair', 'Men''s Cut', 'Precision cut and finish.', 30, 45, 1),
    ('Glow Hair Studio', 'Colour', 'Full Colour', 'Root-to-tip colour application.', 90, 145, 0),
    ('Glow Hair Studio', 'Colour', 'Balayage', 'Hand-painted soft highlight.', 150, 220, 1),
    ('Glow Hair Studio', 'Treatment', 'Keratin Smooth', 'Frizz control treatment.', 120, 280, 0),
    ('Glow Hair Studio', 'Treatment', 'Deep Condition', 'Intensive moisture mask.', 30, 45, 1),
    ('Bella Nails', 'Nails', 'Classic Manicure', 'Shape, cuticle care and polish.', 45, 45, 0),
    ('Bella Nails', 'Nails', 'Gel Manicure', 'Long-wear gel polish.', 60, 65, 1),
    ('Bella Nails', 'Nails', 'Luxury Pedicure', 'Soak, scrub and polish.', 60, 70, 2),
    ('Luxe Beauty', 'Facial', 'Signature Facial', 'Custom facial for your skin.', 60, 110, 0),
    ('Luxe Beauty', 'Waxing', 'Full Leg Wax', 'Smooth finish wax.', 45, 65, 0),
    ('Luxe Beauty', 'Brows', 'Brow Shape & Tint', 'Shape, wax and tint.', 30, 45, 0),
    ('Luxe Beauty', 'Lashes', 'Classic Lash Lift', 'Lift and tint.', 60, 95, 0),
    ('Pure Spa', 'Spa', 'Spa Ritual', 'Full body spa experience.', 90, 180, 0),
    ('Pure Spa', 'Massage', 'Relaxation Massage', 'Full body Swedish massage.', 60, 120, 0),
    ('Pure Spa', 'Massage', 'Deep Tissue', 'Targeted muscle release.', 60, 135, 1),
    ('Pure Spa', 'Facial', 'Glow Facial', 'Hydrating facial.', 50, 99, 0),
    ('Urban Barber', 'Barber', 'Classic Cut', 'Cut, wash and style.', 30, 40, 0),
    ('Urban Barber', 'Barber', 'Skin Fade', 'Precision fade.', 45, 50, 1),
    ('Urban Barber', 'Barber', 'Cut & Beard', 'Haircut with beard tidy.', 45, 60, 2)
) as v(salon_name, category, name, description, duration_minutes, price, sort_order)
  on s.name = v.salon_name
where not exists (
  select 1 from public.salon_services svc
  where svc.salon_id = s.id and svc.name = v.name
);

-- Staff
insert into public.salon_staff (
  salon_id, name, position, photo_url, years_experience, languages, specialties, sort_order
)
select s.id, v.name, v.position, v.photo_url, v.years_experience, v.languages, v.specialties, v.sort_order
from public.salons s
join (
  values
    (
      'Glow Hair Studio', 'Mia Chen', 'Senior Colourist',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      8, array['English','Mandarin'], array['Balayage','Colour Correction'], 0
    ),
    (
      'Glow Hair Studio', 'Jordan Lee', 'Stylist',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      5, array['English'], array['Cuts','Blow Dry'], 1
    ),
    (
      'Glow Hair Studio', 'Sofia Park', 'Treatment Specialist',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
      6, array['English','Korean'], array['Keratin','Repair'], 2
    ),
    (
      'Bella Nails', 'Hannah Kim', 'Nail Artist',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      7, array['English','Korean'], array['Gel','Nail Art'], 0
    ),
    (
      'Bella Nails', 'Emily Tran', 'Manicurist',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      4, array['English','Vietnamese'], array['Manicure','Pedicure'], 1
    ),
    (
      'Luxe Beauty', 'Ava Brooks', 'Beauty Therapist',
      'https://images.unsplash.com/photo-1534528741775-53994d69f251?auto=format&fit=crop&w=400&q=80',
      9, array['English'], array['Facials','Brows'], 0
    ),
    (
      'Pure Spa', 'Noah Williams', 'Massage Therapist',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      10, array['English'], array['Deep Tissue','Relaxation'], 0
    ),
    (
      'Pure Spa', 'Olivia Grant', 'Spa Therapist',
      'https://images.unsplash.com/photo-1531746020798-e6953c1322d5?auto=format&fit=crop&w=400&q=80',
      7, array['English','French'], array['Spa Rituals','Facials'], 1
    ),
    (
      'Urban Barber', 'Marcus Hill', 'Master Barber',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      12, array['English'], array['Fades','Beard'], 0
    ),
    (
      'Urban Barber', 'Chris Nguyen', 'Barber',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      5, array['English','Vietnamese'], array['Classic Cuts'], 1
    )
) as v(salon_name, name, position, photo_url, years_experience, languages, specialties, sort_order)
  on s.name = v.salon_name
where not exists (
  select 1 from public.salon_staff st
  where st.salon_id = s.id and st.name = v.name
);

-- Seed reviews (marketplace demo authors; no auth.users required)
insert into public.reviews (
  salon_id, rating, comment, author_name, author_avatar, images, like_count, created_at
)
select s.id, v.rating, v.comment, v.author_name, v.author_avatar, v.images, v.like_count, now() - (v.days_ago || ' days')::interval
from public.salons s
join (
  values
    (
      'Glow Hair Studio', 5.0,
      'Best balayage I''ve had in Brisbane. Mia took her time and the colour is perfect.',
      'Sarah M.',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80',
      array['https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80'],
      24, 12
    ),
    (
      'Glow Hair Studio', 5.0,
      'Clean salon, friendly team, and my cut grew out beautifully.',
      'James T.',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      11, 28
    ),
    (
      'Glow Hair Studio', 4.0,
      'Great colour result. Slight wait on a Saturday but worth it.',
      'Priya K.',
      'https://images.unsplash.com/photo-1534528741775-53994d69f251?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      6, 45
    ),
    (
      'Bella Nails', 5.0,
      'Gel lasted three weeks without chips. Beautiful studio.',
      'Amy L.',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      array['https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80'],
      18, 8
    ),
    (
      'Bella Nails', 4.0,
      'Lovely manicure and very careful with cuticles.',
      'Chloe R.',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      4, 21
    ),
    (
      'Luxe Beauty', 5.0,
      'Facial left my skin glowing for days. Highly recommend Ava.',
      'Natalie S.',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      15, 14
    ),
    (
      'Pure Spa', 5.0,
      'The spa ritual was incredible — quiet rooms and skilled therapists.',
      'Daniel W.',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      22, 9
    ),
    (
      'Pure Spa', 4.0,
      'Deep tissue was exactly what I needed after a long week.',
      'Rachel P.',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      9, 33
    ),
    (
      'Urban Barber', 5.0,
      'Sharp fade every time. Marcus knows exactly what he''s doing.',
      'Tom H.',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      19, 6
    ),
    (
      'Urban Barber', 4.0,
      'Quick, professional, and great vibe in the shop.',
      'Ben C.',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      '{}'::text[],
      7, 19
    )
) as v(salon_name, rating, comment, author_name, author_avatar, images, like_count, days_ago)
  on s.name = v.salon_name
where not exists (
  select 1 from public.reviews r
  where r.salon_id = s.id and r.author_name = v.author_name and r.comment = v.comment
);

-- Refresh aggregate rating from seeded reviews when present
update public.salons s
set
  rating = agg.avg_rating,
  review_count = agg.cnt
from (
  select
    salon_id,
    round(avg(rating)::numeric, 1) as avg_rating,
    count(*)::integer as cnt
  from public.reviews
  group by salon_id
) agg
where s.id = agg.salon_id;
