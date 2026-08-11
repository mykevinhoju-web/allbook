-- Demo RLS policies for service_requests / request_matches (idempotent).
-- Applied if marketplace_matching_demo ran before these policies existed.

drop policy if exists "Demo insert service requests" on public.service_requests;
create policy "Demo insert service requests"
  on public.service_requests
  for insert
  to anon, authenticated
  with check (is_demo = true);

drop policy if exists "Demo read demo requests" on public.service_requests;
create policy "Demo read demo requests"
  on public.service_requests
  for select
  to anon, authenticated
  using (is_demo = true);

drop policy if exists "Demo insert request matches" on public.request_matches;
create policy "Demo insert request matches"
  on public.request_matches
  for insert
  to anon, authenticated
  with check (is_demo = true);

drop policy if exists "Demo read demo matches" on public.request_matches;
create policy "Demo read demo matches"
  on public.request_matches
  for select
  to anon, authenticated
  using (is_demo = true);
