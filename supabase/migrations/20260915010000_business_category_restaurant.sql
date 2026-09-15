-- Restaurant category for Korean / local dining listings (kor Brisbane phase).
insert into public.business_categories (name, slug, icon, sort_order)
select v.name, v.slug, v.icon, v.sort_order
from (values
  ('Restaurant', 'restaurant', 'utensils', 7)
) as v(name, slug, icon, sort_order)
where not exists (
  select 1 from public.business_categories c where c.slug = v.slug
);
