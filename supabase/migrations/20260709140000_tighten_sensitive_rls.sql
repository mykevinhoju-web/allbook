-- Tighten RLS: remove wide-open ALL policies on sensitive tables.
-- Server routes use the service role (bypasses RLS). Browser clients only need:
--   - tenants (public read)
--   - booking_alert_events (realtime alerts)
--   - push_subscriptions (web push)
--   - bookings SELECT (admin schedule realtime; interim — no anon writes)

-- staff
drop policy if exists "staff_all" on public.staff;

-- staff photos
drop policy if exists "staff_photos_all" on public.staff_photos;

-- rooms
drop policy if exists "rooms_all" on public.rooms;

-- bookings: drop open ALL; allow SELECT only for realtime subscriptions
drop policy if exists "bookings_all" on public.bookings;
drop policy if exists "bookings_realtime_select" on public.bookings;
create policy "bookings_realtime_select"
  on public.bookings
  for select
  to anon, authenticated
  using (true);

-- payments
drop policy if exists "payments_all" on public.payments;

-- admin accounts (server-only via service role)
drop policy if exists "admin_accounts_all" on public.admin_accounts;

-- staff accounts (server-only via service role)
drop policy if exists "staff_accounts_admin_only" on public.staff_accounts;

-- service options
drop policy if exists "service_options_all" on public.service_options;

-- Storage: public read for staff photos; writes via service role only
drop policy if exists "staff_photos_storage_insert" on storage.objects;
drop policy if exists "staff_photos_storage_delete" on storage.objects;
