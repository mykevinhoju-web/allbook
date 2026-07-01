-- Booking alert events for realtime admin notifications (PoC)
create table if not exists public.booking_alert_events (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  staff_id text not null,
  staff_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists booking_alert_events_tenant_slug_idx
  on public.booking_alert_events (tenant_slug, created_at desc);

alter table public.booking_alert_events enable row level security;

drop policy if exists "booking_alerts_insert" on public.booking_alert_events;
create policy "booking_alerts_insert"
  on public.booking_alert_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "booking_alerts_select" on public.booking_alert_events;
create policy "booking_alerts_select"
  on public.booking_alert_events
  for select
  to anon, authenticated
  using (true);

-- Enable Realtime (run once; ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table public.booking_alert_events;
exception
  when duplicate_object then null;
end $$;
