-- Category routes need stable public slugs for /{category}/{slug}.

alter table public.salons
  add column if not exists slug text;

update public.salons
set slug = case name
  when 'Glow Hair Studio' then 'glow-hair-studio'
  when 'Bella Nails' then 'bella-nails'
  when 'Luxe Beauty' then 'luxe-beauty'
  when 'Pure Spa' then 'pure-spa'
  when 'Urban Barber' then 'urban-barber'
  else regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g')
end
where slug is null or slug = '';

alter table public.salons
  alter column slug set not null;

create unique index if not exists salons_slug_uidx on public.salons (slug);
