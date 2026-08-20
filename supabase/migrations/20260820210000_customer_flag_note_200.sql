-- Allow longer admin customer notes (textarea up to 200 chars).
alter table public.tenant_customer_flags
  drop constraint if exists tenant_customer_flags_note_chk;

alter table public.tenant_customer_flags
  add constraint tenant_customer_flags_note_chk
  check (char_length(note) <= 200);
