-- Ownership verification for salon registration / claim.

alter table public.salons
  add column if not exists ownership_status text not null default 'unclaimed';

alter table public.salons
  drop constraint if exists salons_ownership_status_check;

alter table public.salons
  add constraint salons_ownership_status_check
  check (
    ownership_status in (
      'unclaimed',
      'pending_verification',
      'verified',
      'rejected'
    )
  );

comment on column public.salons.ownership_status is
  'unclaimed = catalogue only; pending_verification = owner applied, awaiting review; verified = ownership approved; rejected = claim denied.';

-- Existing claimed rows with an owner are treated as verified.
update public.salons s
set ownership_status = 'verified'
where s.claimed = true
  and s.ownership_status = 'unclaimed'
  and exists (
    select 1 from public.salon_owners so where so.salon_id = s.id
  );

create index if not exists salons_ownership_status_idx
  on public.salons (ownership_status)
  where ownership_status = 'pending_verification';
