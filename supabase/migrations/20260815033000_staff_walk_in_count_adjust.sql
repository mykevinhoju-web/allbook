-- Manual walk-in count adjustments for rotation fairness (not wiped when order is saved).
create table if not exists public.staff_walk_in_count_adjust (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  work_date date not null,
  staff_id uuid not null references public.staff (id) on delete cascade,
  delta integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, work_date, staff_id)
);

create index if not exists staff_walk_in_count_adjust_day_idx
  on public.staff_walk_in_count_adjust (tenant_id, work_date);

alter table public.staff_walk_in_count_adjust enable row level security;

comment on table public.staff_walk_in_count_adjust is
  'Extra walk-in counts added by admin so rotation stays fair when a walk-in was booked as a named guest.';
