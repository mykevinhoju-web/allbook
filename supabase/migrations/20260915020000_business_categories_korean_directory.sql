-- Expand marketplace categories for Korean directory (kor Brisbane).
insert into public.business_categories (name, slug, icon, sort_order)
select v.name, v.slug, v.icon, v.sort_order
from (values
  ('Mart', 'mart', 'shopping-bag', 8),
  ('Medical', 'medical', 'stethoscope', 9),
  ('Academy', 'academy', 'graduation-cap', 10),
  ('Entertainment', 'entertainment', 'music', 11),
  ('Services', 'services', 'briefcase', 12)
) as v(name, slug, icon, sort_order)
where not exists (
  select 1 from public.business_categories c where c.slug = v.slug
);
