-- Sprint 1 — tighten booking PII + lock salon_owners identity columns.

-- ---------------------------------------------------------------------------
-- bookings: further restrict anon/authenticated columns (no status / payment)
-- ---------------------------------------------------------------------------

revoke all on table public.bookings from anon, authenticated;

grant select (
  id,
  tenant_id,
  staff_id,
  room_id,
  starts_at,
  ends_at,
  duration_minutes,
  created_at,
  updated_at
) on table public.bookings to anon, authenticated;

drop policy if exists "bookings_realtime_select" on public.bookings;
drop policy if exists "bookings_realtime_select_schedule_only" on public.bookings;

create policy "bookings_realtime_select_schedule_only"
  on public.bookings
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- salon_owners: prevent escalating salon_id / role / auth_user_id via client
-- ---------------------------------------------------------------------------

create or replace function public.enforce_salon_owner_identity_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.salon_id is distinct from old.salon_id then
      raise exception 'salon_owners.salon_id cannot be changed';
    end if;
    if new.role is distinct from old.role then
      raise exception 'salon_owners.role cannot be changed';
    end if;
    if new.auth_user_id is distinct from old.auth_user_id then
      raise exception 'salon_owners.auth_user_id cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists salon_owners_identity_immutable on public.salon_owners;
create trigger salon_owners_identity_immutable
  before update on public.salon_owners
  for each row
  execute function public.enforce_salon_owner_identity_immutable();

drop policy if exists "Salon owners update own row" on public.salon_owners;
create policy "Salon owners update own row"
  on public.salon_owners
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (
    auth_user_id = auth.uid()
  );

comment on function public.enforce_salon_owner_identity_immutable() is
  'Blocks client updates to salon_id, role, and auth_user_id. Ownership changes use service role.';
