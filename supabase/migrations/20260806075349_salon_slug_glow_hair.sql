-- Prefer short SEO slug for Glow Hair Studio detail URLs.
update public.salons
set slug = 'glow-hair'
where name = 'Glow Hair Studio'
  and suburb = 'Aspley';
