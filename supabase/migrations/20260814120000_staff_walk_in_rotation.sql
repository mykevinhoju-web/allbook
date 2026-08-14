-- Daily walk-in rotation (순번) for on-shift staff.
create table if not exists public.staff_walk_in_rotation (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  work_date date not null,
  staff_id uuid not null references public.staff (id) on delete cascade,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, work_date, staff_id)
);

create index if not exists staff_walk_in_rotation_day_idx
  on public.staff_walk_in_rotation (tenant_id, work_date, sort_order);

alter table public.staff_walk_in_rotation enable row level security;
-- Server routes use service role (bypasses RLS). No anon policies.
