-- Business Settings Engine (permanent configuration framework).
-- Does not redesign Search or Booking & Payment Policy Engine.
-- Booking/Payments/Cancellation/Refunds remain owned by salon_booking_policies;
-- this engine stores unified settings + feature flags + future integration slots.

create table if not exists public.platform_settings (
  group_key text not null,
  setting_key text not null,
  value jsonb not null default 'null'::jsonb,
  description text,
  updated_at timestamptz not null default now(),
  primary key (group_key, setting_key)
);

comment on table public.platform_settings is
  'Platform-level defaults. Resolved before business settings.';

create table if not exists public.salon_settings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  group_key text not null,
  setting_key text not null,
  value jsonb not null default 'null'::jsonb,
  -- Resolution scope: business → service → staff → booking (staff/booking reserved).
  level text not null default 'business'
    check (level in ('business', 'service', 'staff', 'booking')),
  scope_id uuid,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salon_settings_scope_chk check (
    (level = 'business' and scope_id is null)
    or (level <> 'business' and scope_id is not null)
  )
);

-- Unique per salon/group/key/level/scope (null scope → business)
create unique index if not exists salon_settings_business_uidx
  on public.salon_settings (salon_id, group_key, setting_key)
  where level = 'business';

create unique index if not exists salon_settings_scoped_uidx
  on public.salon_settings (salon_id, group_key, setting_key, level, scope_id)
  where level <> 'business';

create index if not exists salon_settings_salon_group_idx
  on public.salon_settings (salon_id, group_key);

comment on table public.salon_settings is
  'Business configuration store. New features add keys — no schema redesign.';

create table if not exists public.salon_feature_flags (
  salon_id uuid not null references public.salons (id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (salon_id, flag_key)
);

comment on table public.salon_feature_flags is
  'Per-salon feature flags (online booking, deposits, loyalty, SMS, marketplace, …).';

create table if not exists public.salon_integration_slots (
  salon_id uuid not null references public.salons (id) on delete cascade,
  provider text not null
    check (provider in (
      'stripe',
      'square',
      'tyro',
      'xero',
      'myob',
      'google_calendar',
      'outlook',
      'apple_calendar',
      'google_business',
      'meta',
      'instagram'
    )),
  status text not null default 'disconnected'
    check (status in ('disconnected', 'pending', 'connected', 'error')),
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (salon_id, provider)
);

comment on table public.salon_integration_slots is
  'Future integration attachments — no gateway implementation yet.';

-- Role → group permission matrix (owner/admin/staff/platform_admin)
create table if not exists public.settings_group_permissions (
  role text not null
    check (role in ('owner', 'admin', 'staff', 'platform_admin')),
  group_key text not null,
  can_read boolean not null default true,
  can_write boolean not null default false,
  primary key (role, group_key)
);

alter table public.platform_settings enable row level security;
alter table public.salon_settings enable row level security;
alter table public.salon_feature_flags enable row level security;
alter table public.salon_integration_slots enable row level security;
alter table public.settings_group_permissions enable row level security;

-- Public read of platform defaults (non-sensitive templates)
drop policy if exists "Public read platform settings" on public.platform_settings;
create policy "Public read platform settings"
  on public.platform_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Owners read own salon settings" on public.salon_settings;
create policy "Owners read own salon settings"
  on public.salon_settings for select
  to authenticated
  using (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_settings.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage own salon settings" on public.salon_settings;
create policy "Owners manage own salon settings"
  on public.salon_settings for all
  to authenticated
  using (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_settings.salon_id
        and so.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_settings.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage own feature flags" on public.salon_feature_flags;
create policy "Owners manage own feature flags"
  on public.salon_feature_flags for all
  to authenticated
  using (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_feature_flags.salon_id
        and so.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_feature_flags.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage own integration slots" on public.salon_integration_slots;
create policy "Owners manage own integration slots"
  on public.salon_integration_slots for all
  to authenticated
  using (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_integration_slots.salon_id
        and so.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.salon_owners so
      where so.salon_id = salon_integration_slots.salon_id
        and so.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated read settings permissions" on public.settings_group_permissions;
create policy "Authenticated read settings permissions"
  on public.settings_group_permissions for select
  to authenticated
  using (true);
