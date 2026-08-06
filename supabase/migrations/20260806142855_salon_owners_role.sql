-- Owner role on salon_owners (permanent auth model companion to auth_user_id)

alter table public.salon_owners
  add column if not exists role text not null default 'owner';

update public.salon_owners
set role = 'owner'
where role is null or role = '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'salon_owners_role_check'
  ) then
    alter table public.salon_owners
      add constraint salon_owners_role_check
      check (role in ('owner', 'admin', 'staff'));
  end if;
exception
  when duplicate_object then null;
end $$;

comment on column public.salon_owners.role is
  'Portal role for this salon. Registration always sets owner.';
