-- Harden Critical #2 / #3 from project-audit-001.
-- Goal: anon cannot read booking PII or manage push/alert tables.
-- Service-role API routes continue to bypass RLS (unchanged app access model).
-- Public salon booking INSERT remains allowed.

-- ---------------------------------------------------------------------------
-- 1) public.bookings (tenant / dayspa)
-- Full PII reads stay service-role only (admin/staff/room APIs).
-- Realtime schedule refresh needs SELECT on non-PII columns only.
-- ---------------------------------------------------------------------------

drop policy if exists "bookings_realtime_select" on public.bookings;
drop policy if exists "bookings_all" on public.bookings;

-- Deny blanket table SELECT; grant schedule columns only (no customer PII / notes).
revoke all on table public.bookings from anon, authenticated;

grant select (
  id,
  tenant_id,
  staff_id,
  room_id,
  starts_at,
  ends_at,
  duration_minutes,
  price_cents,
  status,
  checked_in_at,
  checked_out_at,
  payment_status,
  paid_at,
  created_at,
  updated_at
) on table public.bookings to anon, authenticated;

-- Realtime postgres_changes requires a SELECT policy for the listening role.
-- PII columns are not granted above, so REST/realtime cannot return them.
create policy "bookings_realtime_select_schedule_only"
  on public.bookings
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 2) public.salon_bookings (marketplace)
-- Keep public INSERT for booking creation; remove public SELECT of PII.
-- Salon owners (Supabase Auth) retain SELECT of their own salon rows.
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read salon bookings" on public.salon_bookings;
drop policy if exists "Public can read own salon booking by id" on public.salon_bookings;
drop policy if exists "Public can read live salon bookings" on public.salon_bookings;

-- Preserve public booking creation (status pending/confirmed only).
drop policy if exists "Public can insert salon bookings" on public.salon_bookings;
create policy "Public can insert salon bookings"
  on public.salon_bookings
  for insert
  to anon, authenticated
  with check (
    status in ('pending', 'confirmed')
  );

-- Owner read (re-assert; may already exist).
drop policy if exists "Salon owners read own bookings" on public.salon_bookings;
create policy "Salon owners read own bookings"
  on public.salon_bookings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.salon_owners so
      where so.salon_id = salon_bookings.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3) public.push_subscriptions — service-role only (API upsert/send/cleanup)
-- ---------------------------------------------------------------------------

drop policy if exists "push_subscriptions_insert" on public.push_subscriptions;
drop policy if exists "push_subscriptions_select" on public.push_subscriptions;
drop policy if exists "push_subscriptions_update" on public.push_subscriptions;
drop policy if exists "push_subscriptions_delete" on public.push_subscriptions;

alter table public.push_subscriptions enable row level security;

-- No anon/authenticated policies → deny all for those roles.
-- Authenticated service paths use createServiceSupabase() (bypasses RLS).

-- ---------------------------------------------------------------------------
-- 4) public.booking_alert_events — service-role only
-- ---------------------------------------------------------------------------

drop policy if exists "booking_alerts_insert" on public.booking_alert_events;
drop policy if exists "booking_alerts_select" on public.booking_alert_events;
drop policy if exists "booking_alerts_update" on public.booking_alert_events;
drop policy if exists "booking_alerts_delete" on public.booking_alert_events;

alter table public.booking_alert_events enable row level security;

comment on table public.push_subscriptions is
  'Web push endpoints. RLS: no anon/authenticated policies; mutate via service role APIs only.';
comment on table public.booking_alert_events is
  'Booking alert ledger. RLS: no anon/authenticated policies; mutate via service role APIs only.';
