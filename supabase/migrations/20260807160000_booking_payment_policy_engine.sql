-- Booking & Payment Policy Engine (permanent architecture).
-- No payment gateway implementation — policy + resolution only.
-- Search / Google Import architectures unchanged.

create table if not exists public.salon_booking_policies (
  salon_id uuid primary key references public.salons (id) on delete cascade,

  -- Booking
  booking_enabled boolean not null default true,
  allow_walk_ins boolean not null default true,
  appointment_only boolean not null default false,
  approval_required boolean not null default false,
  instant_confirmation boolean not null default true,
  max_advance_booking_days integer not null default 90
    check (max_advance_booking_days between 1 and 730),
  min_notice_hours integer not null default 2
    check (min_notice_hours between 0 and 168),

  -- Payment mode (gateway-agnostic)
  payment_mode text not null default 'booking_only'
    check (payment_mode in (
      'booking_only',
      'fixed_deposit',
      'percentage_deposit',
      'full_prepayment',
      'card_hold'
    )),
  deposit_amount_cents integer
    check (deposit_amount_cents is null or deposit_amount_cents >= 0),
  deposit_percent numeric(5,2)
    check (deposit_percent is null or (deposit_percent >= 0 and deposit_percent <= 100)),
  currency text not null default 'AUD',

  -- Capture / balance (future gateways plug in here)
  capture_mode text not null default 'none'
    check (capture_mode in (
      'none',
      'immediate',
      'deposit',
      'automatic_capture',
      'manual_capture',
      'card_hold'
    )),
  remaining_balance_in_salon boolean not null default true,
  online_payment_enabled boolean not null default false,

  -- Cancellation
  cancellation_window_hours integer not null default 24
    check (cancellation_window_hours between 0 and 8760),
  cancellation_refund_percent numeric(5,2) not null default 100
    check (cancellation_refund_percent >= 0 and cancellation_refund_percent <= 100),
  deposit_forfeiture_percent numeric(5,2) not null default 0
    check (deposit_forfeiture_percent >= 0 and deposit_forfeiture_percent <= 100),

  -- No-show
  no_show_action text not null default 'record_only'
    check (no_show_action in ('record_only', 'fee', 'charge_hold')),
  no_show_fee_cents integer
    check (no_show_fee_cents is null or no_show_fee_cents >= 0),

  -- Refund
  refund_mode text not null default 'none'
    check (refund_mode in ('none', 'full', 'partial', 'policy_based')),

  -- Future provider slot (null = not connected)
  payment_provider text
    check (payment_provider is null or payment_provider in (
      'stripe_connect',
      'square',
      'tyro',
      'paypal',
      'gift_card',
      'loyalty',
      'membership',
      'promo',
      'package',
      'invoice',
      'manual'
    )),
  provider_config jsonb not null default '{}'::jsonb,

  -- Extensibility: tax, settlement, split payments, etc. without redesign
  extensions jsonb not null default '{}'::jsonb,

  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.salon_booking_policies is
  'Business-level booking/payment policy. Gateways attach via payment_provider + provider_config; no gateway required to accept bookings.';

create table if not exists public.salon_service_policy_overrides (
  service_id uuid primary key references public.salon_services (id) on delete cascade,
  salon_id uuid not null references public.salons (id) on delete cascade,
  enabled boolean not null default true,

  payment_mode text
    check (payment_mode is null or payment_mode in (
      'booking_only',
      'fixed_deposit',
      'percentage_deposit',
      'full_prepayment',
      'card_hold'
    )),
  deposit_amount_cents integer
    check (deposit_amount_cents is null or deposit_amount_cents >= 0),
  deposit_percent numeric(5,2)
    check (deposit_percent is null or (deposit_percent >= 0 and deposit_percent <= 100)),
  capture_mode text
    check (capture_mode is null or capture_mode in (
      'none',
      'immediate',
      'deposit',
      'automatic_capture',
      'manual_capture',
      'card_hold'
    )),
  cancellation_window_hours integer
    check (cancellation_window_hours is null or cancellation_window_hours between 0 and 8760),
  cancellation_refund_percent numeric(5,2)
    check (cancellation_refund_percent is null or (cancellation_refund_percent >= 0 and cancellation_refund_percent <= 100)),
  deposit_forfeiture_percent numeric(5,2)
    check (deposit_forfeiture_percent is null or (deposit_forfeiture_percent >= 0 and deposit_forfeiture_percent <= 100)),
  no_show_action text
    check (no_show_action is null or no_show_action in ('record_only', 'fee', 'charge_hold')),
  no_show_fee_cents integer
    check (no_show_fee_cents is null or no_show_fee_cents >= 0),
  refund_mode text
    check (refund_mode is null or refund_mode in ('none', 'full', 'partial', 'policy_based')),
  online_payment_enabled boolean,

  extensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salon_service_policy_overrides_salon_idx
  on public.salon_service_policy_overrides (salon_id);

-- Snapshot acceptance on bookings (policy engine contract for confirm step)
alter table public.salon_bookings
  add column if not exists policy_snapshot jsonb,
  add column if not exists policy_accepted_at timestamptz;

comment on column public.salon_bookings.policy_snapshot is
  'Resolved policy shown to customer at confirm time (immutable audit).';
comment on column public.salon_bookings.policy_accepted_at is
  'When the customer explicitly accepted booking/cancellation/deposit/refund policies.';

alter table public.salon_booking_policies enable row level security;
alter table public.salon_service_policy_overrides enable row level security;

drop policy if exists "Public read salon booking policies" on public.salon_booking_policies;
create policy "Public read salon booking policies"
  on public.salon_booking_policies for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read service policy overrides" on public.salon_service_policy_overrides;
create policy "Public read service policy overrides"
  on public.salon_service_policy_overrides for select
  to anon, authenticated
  using (true);

-- Owner manage via service role in API; authenticated owners can also update own salon.
drop policy if exists "Owners manage own booking policies" on public.salon_booking_policies;
create policy "Owners manage own booking policies"
  on public.salon_booking_policies for all
  to authenticated
  using (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_booking_policies.salon_id
        and so.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_booking_policies.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage own service policy overrides" on public.salon_service_policy_overrides;
create policy "Owners manage own service policy overrides"
  on public.salon_service_policy_overrides for all
  to authenticated
  using (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_service_policy_overrides.salon_id
        and so.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_service_policy_overrides.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

-- Seed default policies for existing salons (Booking Only — ready to accept bookings).
insert into public.salon_booking_policies (salon_id)
select s.id
from public.salons s
where not exists (
  select 1 from public.salon_booking_policies p where p.salon_id = s.id
);
