-- Admin customer list: good (+) / bad (-) flags and a short note.
create table if not exists public.tenant_customer_flags (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_key text not null,
  rating text,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, customer_key),
  constraint tenant_customer_flags_rating_chk
    check (rating is null or rating in ('good', 'bad')),
  constraint tenant_customer_flags_key_chk
    check (char_length(customer_key) between 1 and 200),
  constraint tenant_customer_flags_note_chk
    check (char_length(note) <= 160)
);

create index if not exists tenant_customer_flags_tenant_idx
  on public.tenant_customer_flags (tenant_id);

alter table public.tenant_customer_flags enable row level security;

comment on table public.tenant_customer_flags is
  'Admin marks on booking customers: good (+), bad (-), and a short comment.';
