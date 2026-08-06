-- Room tablet claim: one active device per room (no password).

alter table public.rooms
  add column if not exists claimed_device_id text null,
  add column if not exists claimed_at timestamptz null;

comment on column public.rooms.claimed_device_id is
  'Tablet device token currently bound to this room; null = free.';
comment on column public.rooms.claimed_at is
  'When the current tablet claim was established.';
