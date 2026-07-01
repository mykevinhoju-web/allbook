-- Web Push subscriptions per tenant (admin devices)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_tenant_slug_idx
  on public.push_subscriptions (tenant_slug);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_insert" on public.push_subscriptions;
create policy "push_subscriptions_insert"
  on public.push_subscriptions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "push_subscriptions_select" on public.push_subscriptions;
create policy "push_subscriptions_select"
  on public.push_subscriptions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "push_subscriptions_delete" on public.push_subscriptions;
create policy "push_subscriptions_delete"
  on public.push_subscriptions
  for delete
  to anon, authenticated
  using (true);
