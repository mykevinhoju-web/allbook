-- Dayspa is in Queensland (no DST). Sydney was shifting wall-clock times by 1h in AEDT.
update public.tenants
set timezone = 'Australia/Brisbane'
where slug = 'dayspa'
  and timezone is distinct from 'Australia/Brisbane';
