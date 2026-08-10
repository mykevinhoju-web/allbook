-- Backfill amenities + search_keywords from salon name/description.
-- Safe to re-run: only appends missing tokens. Prefer ilike for reliability.

update public.salons
set
  search_keywords = search_keywords || array['korean'],
  updated_at = now()
where (
    name ilike '%korean%'
    or name ilike '%k-beauty%'
    or coalesce(description, '') ilike '%korean%'
  )
  and not ('korean' = any (search_keywords));

update public.salons
set
  search_keywords = search_keywords || array['kids'],
  updated_at = now()
where (
    name ilike '%kid%'
    or name ilike '%child%'
    or name ilike '%family%'
    or coalesce(description, '') ilike '%kid%'
    or coalesce(description, '') ilike '%child%'
  )
  and not ('kids' = any (search_keywords));

update public.salons
set
  search_keywords = search_keywords || array['japanese'],
  updated_at = now()
where (
    name ilike '%japanese%'
    or coalesce(description, '') ilike '%japanese%'
  )
  and not ('japanese' = any (search_keywords));

update public.salons
set
  search_keywords = search_keywords || array['chinese'],
  updated_at = now()
where (
    name ilike '%chinese%'
    or coalesce(description, '') ilike '%chinese%'
  )
  and not ('chinese' = any (search_keywords));

update public.salons
set
  search_keywords = search_keywords || array['bridal'],
  updated_at = now()
where (
    name ilike '%bridal%'
    or name ilike '%wedding%'
    or coalesce(description, '') ilike '%bridal%'
  )
  and not ('bridal' = any (search_keywords));

update public.salons
set
  search_keywords = search_keywords || array['organic'],
  updated_at = now()
where (
    name ilike '%organic%'
    or name ilike '%vegan%'
    or coalesce(description, '') ilike '%organic%'
  )
  and not ('organic' = any (search_keywords));

update public.salons
set
  search_keywords = search_keywords || array['balayage'],
  updated_at = now()
where (
    name ilike '%balayage%'
    or coalesce(description, '') ilike '%balayage%'
  )
  and not ('balayage' = any (search_keywords));

update public.salons
set
  search_keywords = search_keywords || array['extensions'],
  updated_at = now()
where (
    name ilike '%extension%'
    or coalesce(description, '') ilike '%extension%'
  )
  and not ('extensions' = any (search_keywords));

update public.salons
set
  amenities = amenities || array['parking'],
  updated_at = now()
where (
    name ilike '%parking%'
    or name ilike '%car park%'
    or coalesce(description, '') ilike '%parking%'
  )
  and not ('parking' = any (amenities));

update public.salons
set
  amenities = amenities || array['wifi'],
  updated_at = now()
where (
    name ilike '%wifi%'
    or name ilike '%wi-fi%'
    or coalesce(description, '') ilike '%wifi%'
  )
  and not ('wifi' = any (amenities));

update public.salons
set
  amenities = amenities || array['wheelchair'],
  updated_at = now()
where (
    name ilike '%wheelchair%'
    or name ilike '%accessible%'
    or coalesce(description, '') ilike '%wheelchair%'
  )
  and not ('wheelchair' = any (amenities));
