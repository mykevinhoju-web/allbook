-- Fix push alerts on existing Supabase projects (e.g. dbmrcqpvdilmrmgpyhxh)
-- Run in SQL Editor if "Turn on alerts" fails after deploy.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions
  add column if not exists audience text not null default 'admin';

alter table public.push_subscriptions
  add column if not exists staff_id uuid;

do $$
begin
  alter table public.push_subscriptions
    add constraint push_subscriptions_audience_check
    check (audience in ('admin', 'staff'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.push_subscriptions
    add constraint push_subscriptions_staff_id_fkey
    foreign key (staff_id) references public.staff (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

create index if not exists push_subscriptions_tenant_slug_idx
  on public.push_subscriptions (tenant_slug);

create index if not exists push_subscriptions_tenant_audience_idx
  on public.push_subscriptions (tenant_slug, audience);

create index if not exists push_subscriptions_staff_idx
  on public.push_subscriptions (staff_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_insert" on public.push_subscriptions;
create policy "push_subscriptions_insert"
  on public.push_subscriptions for insert to anon, authenticated with check (true);

drop policy if exists "push_subscriptions_select" on public.push_subscriptions;
create policy "push_subscriptions_select"
  on public.push_subscriptions for select to anon, authenticated using (true);

drop policy if exists "push_subscriptions_update" on public.push_subscriptions;
create policy "push_subscriptions_update"
  on public.push_subscriptions for update to anon, authenticated using (true) with check (true);

drop policy if exists "push_subscriptions_delete" on public.push_subscriptions;
create policy "push_subscriptions_delete"
  on public.push_subscriptions for delete to anon, authenticated using (true);
