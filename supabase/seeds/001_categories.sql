-- Seed: business_categories (idempotent by slug)
-- Columns used: name, slug, icon (sort_order optional, already on table)

insert into public.business_categories (name, slug, icon, sort_order)
select v.name, v.slug, v.icon, v.sort_order
from (values
  ('Hair', 'hair', 'scissors', 0),
  ('Day Spa', 'day-spa', 'lotus', 1),
  ('Nails', 'nails', 'sparkles', 2),
  ('Barber', 'barber', 'razor', 3),
  ('Massage', 'massage', 'hand', 4),
  ('Facial', 'facial', 'sparkle', 5),
  ('Waxing', 'waxing', 'droplet', 6)
) as v(name, slug, icon, sort_order)
where not exists (
  select 1
  from public.business_categories c
  where c.slug = v.slug
);
