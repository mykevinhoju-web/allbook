-- Admin needs to see staff PINs; store plaintext alongside password_hash.
-- Login still verifies via password_hash; pin is for admin display/edit only.

alter table public.staff_accounts
  add column if not exists pin text null;

alter table public.staff_accounts
  drop constraint if exists staff_accounts_pin_format;

alter table public.staff_accounts
  add constraint staff_accounts_pin_format
  check (pin is null or pin ~ '^\d{4}$');

create unique index if not exists staff_accounts_tenant_pin_uidx
  on public.staff_accounts (tenant_id, pin)
  where pin is not null;
