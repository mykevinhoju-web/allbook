-- Allow applicants to see their own claim status (owner portal pending gate).

create policy salon_claim_requests_select_own
  on public.salon_claim_requests
  for select
  to authenticated
  using (auth.uid() = auth_user_id);
