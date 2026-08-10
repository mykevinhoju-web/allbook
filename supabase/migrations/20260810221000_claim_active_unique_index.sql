drop index if exists public.salon_claim_requests_pending_salon_uidx;

create unique index if not exists salon_claim_requests_active_salon_uidx
  on public.salon_claim_requests (salon_id)
  where status in (
    'pending',
    'email_verified',
    'business_verification_required',
    'business_verified'
  );
