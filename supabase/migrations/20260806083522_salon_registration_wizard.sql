-- Salon registration wizard fields + owner accounts.

alter table public.salons
  add column if not exists registration_method text
    check (registration_method in ('google', 'manual', 'admin')),
  add column if not exists google_place_id text,
  add column if not exists social_instagram text,
  add column if not exists social_facebook text,
  add column if not exists social_tiktok text,
  add column if not exists languages text[] not null default '{}';

create index if not exists salons_google_place_id_idx
  on public.salons (google_place_id)
  where google_place_id is not null;

create table if not exists public.salon_owners (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons (id) on delete cascade,
  full_name text not null,
  email text not null,
  password_hash text not null,
  accepted_terms_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email),
  unique (salon_id)
);

create index if not exists salon_owners_email_idx on public.salon_owners (email);

alter table public.salon_owners enable row level security;

-- Owners manage via service role / platform APIs (no public read of password hashes)
drop policy if exists "No public salon owner access" on public.salon_owners;
-- Intentionally no anon/authenticated policies — service role only.
