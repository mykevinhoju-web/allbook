-- Tenant operations: staff, photos, rooms, bookings
-- Scoped by tenant_id for platform-wide reuse (dayspa today, any tenant later).

-- Staff profiles
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'on_leave')),
  attributes jsonb not null default '{}'::jsonb,
  working_days text[] not null default array['mon','tue','wed','thu','fri'],
  working_hours_start time not null default '09:00',
  working_hours_end time not null default '18:00',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_tenant_id_idx on public.staff (tenant_id, sort_order);
create index if not exists staff_tenant_status_idx on public.staff (tenant_id, status);

-- Staff photos (1–5 per staff; sort_order 0 = primary)
create table if not exists public.staff_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists staff_photos_staff_id_idx
  on public.staff_photos (staff_id, sort_order);

-- Treatment rooms (count configurable per tenant)
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_tenant_id_idx on public.rooms (tenant_id, sort_order);

-- Bookings with staff + auto-assigned room
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete restrict,
  room_id uuid references public.rooms (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  customer_name text,
  customer_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists bookings_tenant_starts_idx
  on public.bookings (tenant_id, starts_at);
create index if not exists bookings_staff_starts_idx
  on public.bookings (staff_id, starts_at);
create index if not exists bookings_room_starts_idx
  on public.bookings (room_id, starts_at);

-- RLS (application scopes by tenant_id; open policies match existing PoC tables)
alter table public.staff enable row level security;
alter table public.staff_photos enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "staff_all" on public.staff;
create policy "staff_all" on public.staff for all to anon, authenticated using (true) with check (true);

drop policy if exists "staff_photos_all" on public.staff_photos;
create policy "staff_photos_all" on public.staff_photos for all to anon, authenticated using (true) with check (true);

drop policy if exists "rooms_all" on public.rooms;
create policy "rooms_all" on public.rooms for all to anon, authenticated using (true) with check (true);

drop policy if exists "bookings_all" on public.bookings;
create policy "bookings_all" on public.bookings for all to anon, authenticated using (true) with check (true);

-- Realtime for live booking board
do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception
  when duplicate_object then null;
end $$;

-- Default rooms for DaySpa tenant (safe if tenant missing)
insert into public.rooms (tenant_id, name, sort_order)
select t.id, 'Room ' || n.num, n.num
from public.tenants t
cross join generate_series(1, 6) as n(num)
where t.slug = 'dayspa'
  and not exists (select 1 from public.rooms r where r.tenant_id = t.id);

-- Storage bucket for staff photos
insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do nothing;

drop policy if exists "staff_photos_storage_select" on storage.objects;
create policy "staff_photos_storage_select"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_storage_insert" on storage.objects;
create policy "staff_photos_storage_insert"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_storage_delete" on storage.objects;
create policy "staff_photos_storage_delete"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'staff-photos');
