-- Fix "violates row-level security policy" on push subscription upsert (UPDATE path).

drop policy if exists "push_subscriptions_update" on public.push_subscriptions;
create policy "push_subscriptions_update"
  on public.push_subscriptions
  for update
  to anon, authenticated
  using (true)
  with check (true);
