-- Allow room-tablet push subscriptions (Home Screen PWA on room devices).

alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_audience_check;

alter table public.push_subscriptions
  add constraint push_subscriptions_audience_check
  check (audience in ('admin', 'staff', 'room'));

alter table public.push_subscriptions
  add column if not exists room_id uuid references public.rooms (id) on delete set null;

create index if not exists push_subscriptions_tenant_room_idx
  on public.push_subscriptions (tenant_slug, room_id)
  where audience = 'room';
