-- Customer card payments (Stripe PaymentIntent).

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'AUD',
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  stripe_payment_intent_id text unique,
  stripe_charge_id text,
  paid_at timestamptz,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

create index if not exists payments_tenant_status_idx
  on public.payments (tenant_id, status);

create index if not exists payments_booking_idx
  on public.payments (booking_id);

alter table public.bookings
  add column if not exists payment_status text not null default 'not_required'
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded', 'not_required'));

alter table public.bookings
  add column if not exists paid_at timestamptz;

alter table public.payments enable row level security;

drop policy if exists "payments_all" on public.payments;
create policy "payments_all" on public.payments for all to anon, authenticated
  using (true) with check (true);
