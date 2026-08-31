-- Admin staff notes board (date + staff + message).
create table if not exists public.staff_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  note_date date not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_notes_body_chk check (char_length(body) between 1 and 4000)
);

create index if not exists staff_notes_tenant_date_idx
  on public.staff_notes (tenant_id, note_date desc, created_at desc);

create index if not exists staff_notes_staff_idx
  on public.staff_notes (tenant_id, staff_id);

alter table public.staff_notes enable row level security;

comment on table public.staff_notes is
  'Tenant admin board: staff notes by calendar date.';
