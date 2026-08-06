-- Salon CRM: extend marketplace customers + notes, tags, stats, timeline, media.

alter table public.salon_customers
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birthday date,
  add column if not exists gender text
    check (gender is null or gender in ('female', 'male', 'non_binary', 'prefer_not', 'other')),
  add column if not exists avatar text,
  add column if not exists status text not null default 'regular'
    check (status in ('vip', 'regular', 'inactive', 'blocked')),
  add column if not exists preferred_staff_id uuid references public.salon_staff (id) on delete set null,
  add column if not exists loyalty_points integer not null default 0;

update public.salon_customers
set
  first_name = coalesce(
    nullif(first_name, ''),
    split_part(full_name, ' ', 1)
  ),
  last_name = coalesce(
    nullif(last_name, ''),
    nullif(trim(both from substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''),
    ''
  )
where first_name is null or last_name is null;

create index if not exists salon_customers_salon_status_idx
  on public.salon_customers (salon_id, status);

create index if not exists salon_customers_phone_idx
  on public.salon_customers (salon_id, phone)
  where phone is not null;

create table if not exists public.salon_customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.salon_customers (id) on delete cascade,
  staff_id uuid references public.salon_staff (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists salon_customer_notes_customer_id_idx
  on public.salon_customer_notes (customer_id, created_at desc);

alter table public.salon_customer_notes enable row level security;
-- Staff/owner only via service role (no public policies).

create table if not exists public.salon_customer_tags (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.salon_customers (id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (customer_id, tag)
);

create index if not exists salon_customer_tags_customer_id_idx
  on public.salon_customer_tags (customer_id);

alter table public.salon_customer_tags enable row level security;

create table if not exists public.salon_customer_statistics (
  customer_id uuid primary key references public.salon_customers (id) on delete cascade,
  total_bookings integer not null default 0,
  completed_bookings integer not null default 0,
  cancelled_bookings integer not null default 0,
  total_spent numeric(12, 2) not null default 0,
  average_spent numeric(12, 2) not null default 0,
  last_visit date,
  next_booking date,
  preferred_staff_id uuid references public.salon_staff (id) on delete set null,
  favorite_service_id uuid references public.salon_services (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.salon_customer_statistics enable row level security;

create table if not exists public.salon_customer_timeline (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.salon_customers (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'booking_created',
      'booking_completed',
      'booking_cancelled',
      'review_submitted',
      'payment_completed',
      'note_added',
      'status_changed'
    )),
  title text not null,
  detail text,
  booking_id uuid references public.salon_bookings (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists salon_customer_timeline_customer_idx
  on public.salon_customer_timeline (customer_id, created_at desc);

alter table public.salon_customer_timeline enable row level security;

create table if not exists public.salon_customer_media (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.salon_customers (id) on delete cascade,
  url text not null,
  media_type text not null default 'upload'
    check (media_type in ('before', 'after', 'upload')),
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists salon_customer_media_customer_idx
  on public.salon_customer_media (customer_id, created_at desc);

alter table public.salon_customer_media enable row level security;
