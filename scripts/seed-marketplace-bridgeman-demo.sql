-- Bridgeman Downs multi-category Marketplace DEMO partners (idempotent).
-- Hair / Nail / Lawn Care / Dog Grooming — fictional sample businesses only.
-- Canonical English amenities:
--   wheelchair_accessible | kids_friendly | parking_available
--   pet_safe | same_day_service | weekend_available
--   small_dogs | large_dogs | mobile_service
-- Never run automatically in production deploys — apply manually / via seed script.

-- Bridgeman Downs suburb id
-- 7e2a60cc-92b9-4a3b-8b40-d365c1df8e05

delete from public.marketplace_partners
where id in (
  'b1111111-1111-4111-8111-111111111201',
  'b1111111-1111-4111-8111-111111111202',
  'b1111111-1111-4111-8111-111111111203',
  'b1111111-1111-4111-8111-111111111301',
  'b1111111-1111-4111-8111-111111111302',
  'b1111111-1111-4111-8111-111111111303',
  'b1111111-1111-4111-8111-111111111401',
  'b1111111-1111-4111-8111-111111111402',
  'b1111111-1111-4111-8111-111111111403',
  'b1111111-1111-4111-8111-111111111501',
  'b1111111-1111-4111-8111-111111111502',
  'b1111111-1111-4111-8111-111111111503'
);

delete from auth.identities
where user_id in (
  'a1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111203',
  'a1111111-1111-4111-8111-111111111301',
  'a1111111-1111-4111-8111-111111111302',
  'a1111111-1111-4111-8111-111111111303',
  'a1111111-1111-4111-8111-111111111401',
  'a1111111-1111-4111-8111-111111111402',
  'a1111111-1111-4111-8111-111111111403',
  'a1111111-1111-4111-8111-111111111501',
  'a1111111-1111-4111-8111-111111111502',
  'a1111111-1111-4111-8111-111111111503'
);

delete from auth.users
where id in (
  'a1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111203',
  'a1111111-1111-4111-8111-111111111301',
  'a1111111-1111-4111-8111-111111111302',
  'a1111111-1111-4111-8111-111111111303',
  'a1111111-1111-4111-8111-111111111401',
  'a1111111-1111-4111-8111-111111111402',
  'a1111111-1111-4111-8111-111111111403',
  'a1111111-1111-4111-8111-111111111501',
  'a1111111-1111-4111-8111-111111111502',
  'a1111111-1111-4111-8111-111111111503'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
) values
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111201','authenticated','authenticated','abc.hair@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111202','authenticated','authenticated','bbc.hair@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111203','authenticated','authenticated','ccc.hair@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111301','authenticated','authenticated','abc.nails@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111302','authenticated','authenticated','bbc.nails@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111303','authenticated','authenticated','ccc.nails@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111401','authenticated','authenticated','abc.lawn@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111402','authenticated','authenticated','bbc.lawn@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111403','authenticated','authenticated','ccc.lawn@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111501','authenticated','authenticated','abc.dog@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111502','authenticated','authenticated','bbc.dog@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','',''),
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111503','authenticated','authenticated','ccc.dog@allbook.demo',crypt('demo-only', gen_salt('bf')),now(),now(),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"demo":true}'::jsonb,false,'','','','');

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  u.id, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', u.id::text, now(), now(), now()
from auth.users u
where u.id in (
  'a1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111203',
  'a1111111-1111-4111-8111-111111111301',
  'a1111111-1111-4111-8111-111111111302',
  'a1111111-1111-4111-8111-111111111303',
  'a1111111-1111-4111-8111-111111111401',
  'a1111111-1111-4111-8111-111111111402',
  'a1111111-1111-4111-8111-111111111403',
  'a1111111-1111-4111-8111-111111111501',
  'a1111111-1111-4111-8111-111111111502',
  'a1111111-1111-4111-8111-111111111503'
);

insert into public.marketplace_partners (
  id, auth_user_id, salon_id, partner_type, status, display_name, bio, email,
  address, latitude, longitude, amenities, is_demo, verified_at
) values
-- HAIR
(
  'b1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111201',
  null, 'independent', 'active', 'ABC Hair',
  'DEMO sample salon — wheelchair accessible haircuts in Bridgeman Downs.',
  'abc.hair@allbook.demo',
  '123 Demo Street, Bridgeman Downs QLD 4035',
  -27.3542, 153.0015,
  array['wheelchair_accessible']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111202',
  null, 'independent', 'active', 'BBC Hair',
  'DEMO sample salon — kids-friendly haircuts in Bridgeman Downs.',
  'bbc.hair@allbook.demo',
  '145 Test Avenue, Bridgeman Downs QLD 4035',
  -27.3561, 152.9988,
  array['kids_friendly']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111203',
  'a1111111-1111-4111-8111-111111111203',
  null, 'independent', 'active', 'CCC Hair',
  'DEMO sample salon — parking available in Bridgeman Downs.',
  'ccc.hair@allbook.demo',
  '178 Sample Road, Bridgeman Downs QLD 4035',
  -27.3535, 153.0042,
  array['parking_available']::text[],
  true, now()
),
-- NAIL
(
  'b1111111-1111-4111-8111-111111111301',
  'a1111111-1111-4111-8111-111111111301',
  null, 'independent', 'active', 'ABC Nails',
  'DEMO sample nail studio — wheelchair accessible.',
  'abc.nails@allbook.demo',
  '210 Demo Lane, Bridgeman Downs QLD 4035',
  -27.3558, 153.0028,
  array['wheelchair_accessible']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111302',
  'a1111111-1111-4111-8111-111111111302',
  null, 'independent', 'active', 'BBC Nails',
  'DEMO sample nail studio — kids friendly.',
  'bbc.nails@allbook.demo',
  '232 Trial Court, Bridgeman Downs QLD 4035',
  -27.3570, 152.9995,
  array['kids_friendly']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111303',
  'a1111111-1111-4111-8111-111111111303',
  null, 'independent', 'active', 'CCC Nails',
  'DEMO sample nail studio — parking available.',
  'ccc.nails@allbook.demo',
  '254 Example Way, Bridgeman Downs QLD 4035',
  -27.3528, 153.0055,
  array['parking_available']::text[],
  true, now()
),
-- LAWN CARE
(
  'b1111111-1111-4111-8111-111111111401',
  'a1111111-1111-4111-8111-111111111401',
  null, 'independent', 'active', 'ABC Lawn Care',
  'DEMO sample lawn service — pet safe treatments.',
  'abc.lawn@allbook.demo',
  '12 Fixture Crescent, Bridgeman Downs QLD 4035',
  -27.3582, 153.0002,
  array['pet_safe']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111402',
  'a1111111-1111-4111-8111-111111111402',
  null, 'independent', 'active', 'BBC Lawn Care',
  'DEMO sample lawn service — same-day weekday jobs.',
  'bbc.lawn@allbook.demo',
  '34 Mock Place, Bridgeman Downs QLD 4035',
  -27.3519, 152.9975,
  array['same_day_service']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111403',
  'a1111111-1111-4111-8111-111111111403',
  null, 'independent', 'active', 'CCC Lawn Care',
  'DEMO sample lawn service — weekend availability.',
  'ccc.lawn@allbook.demo',
  '56 Stub Drive, Bridgeman Downs QLD 4035',
  -27.3595, 153.0038,
  array['weekend_available']::text[],
  true, now()
),
-- DOG GROOMING
(
  'b1111111-1111-4111-8111-111111111501',
  'a1111111-1111-4111-8111-111111111501',
  null, 'independent', 'active', 'ABC Dog Grooming',
  'DEMO sample groomer — small dogs.',
  'abc.dog@allbook.demo',
  '78 Puppy Parade, Bridgeman Downs QLD 4035',
  -27.3548, 152.9968,
  array['small_dogs']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111502',
  'a1111111-1111-4111-8111-111111111502',
  null, 'independent', 'active', 'BBC Dog Grooming',
  'DEMO sample groomer — large dogs.',
  'bbc.dog@allbook.demo',
  '90 Canine Close, Bridgeman Downs QLD 4035',
  -27.3568, 153.0062,
  array['large_dogs']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111503',
  'a1111111-1111-4111-8111-111111111503',
  null, 'independent', 'active', 'CCC Dog Grooming',
  'DEMO sample groomer — mobile home visits.',
  'ccc.dog@allbook.demo',
  '112 Mobile Mews, Bridgeman Downs QLD 4035',
  -27.3508, 153.0010,
  array['mobile_service']::text[],
  true, now()
);

insert into public.partner_services (
  id, partner_id, category_slug, name, pricing_type, price_cents, currency, duration_minutes, is_active, attributes
) values
(
  'c1111111-1111-4111-8111-111111111201',
  'b1111111-1111-4111-8111-111111111201',
  'hair', 'Haircut', 'fixed', 3500, 'AUD', 45, true,
  '{"wheelchair_accessible":true,"kids_friendly":false,"parking_available":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111202',
  'b1111111-1111-4111-8111-111111111202',
  'hair', 'Haircut', 'fixed', 4500, 'AUD', 45, true,
  '{"wheelchair_accessible":false,"kids_friendly":true,"parking_available":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111203',
  'b1111111-1111-4111-8111-111111111203',
  'hair', 'Haircut', 'fixed', 5500, 'AUD', 45, true,
  '{"wheelchair_accessible":false,"kids_friendly":false,"parking_available":true}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111301',
  'b1111111-1111-4111-8111-111111111301',
  'nail', 'Manicure', 'fixed', 3000, 'AUD', 40, true,
  '{"wheelchair_accessible":true,"kids_friendly":false,"parking_available":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111302',
  'b1111111-1111-4111-8111-111111111302',
  'nail', 'Manicure', 'fixed', 4000, 'AUD', 40, true,
  '{"wheelchair_accessible":false,"kids_friendly":true,"parking_available":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111303',
  'b1111111-1111-4111-8111-111111111303',
  'nail', 'Manicure', 'fixed', 5000, 'AUD', 40, true,
  '{"wheelchair_accessible":false,"kids_friendly":false,"parking_available":true}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111401',
  'b1111111-1111-4111-8111-111111111401',
  'lawn_care', 'Lawn Mowing', 'fixed', 6000, 'AUD', 60, true,
  '{"pet_safe":true,"same_day_service":false,"weekend_available":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111402',
  'b1111111-1111-4111-8111-111111111402',
  'lawn_care', 'Lawn Mowing', 'fixed', 7500, 'AUD', 60, true,
  '{"pet_safe":false,"same_day_service":true,"weekend_available":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111403',
  'b1111111-1111-4111-8111-111111111403',
  'lawn_care', 'Lawn Mowing', 'fixed', 9000, 'AUD', 60, true,
  '{"pet_safe":false,"same_day_service":false,"weekend_available":true}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111501',
  'b1111111-1111-4111-8111-111111111501',
  'dog_grooming', 'Dog Grooming', 'fixed', 4500, 'AUD', 60, true,
  '{"small_dogs":true,"large_dogs":false,"mobile_service":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111502',
  'b1111111-1111-4111-8111-111111111502',
  'dog_grooming', 'Dog Grooming', 'fixed', 6000, 'AUD', 75, true,
  '{"small_dogs":false,"large_dogs":true,"mobile_service":false}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111503',
  'b1111111-1111-4111-8111-111111111503',
  'dog_grooming', 'Dog Grooming', 'fixed', 7500, 'AUD', 75, true,
  '{"small_dogs":false,"large_dogs":false,"mobile_service":true}'::jsonb
);

insert into public.partner_service_areas (
  id, partner_id, service_id, mode, suburb_id
) values
('d1111111-1111-4111-8111-111111111201','b1111111-1111-4111-8111-111111111201',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111202','b1111111-1111-4111-8111-111111111202',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111203','b1111111-1111-4111-8111-111111111203',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111301','b1111111-1111-4111-8111-111111111301',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111302','b1111111-1111-4111-8111-111111111302',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111303','b1111111-1111-4111-8111-111111111303',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111401','b1111111-1111-4111-8111-111111111401',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111402','b1111111-1111-4111-8111-111111111402',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111403','b1111111-1111-4111-8111-111111111403',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111501','b1111111-1111-4111-8111-111111111501',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111502','b1111111-1111-4111-8111-111111111502',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'),
('d1111111-1111-4111-8111-111111111503','b1111111-1111-4111-8111-111111111503',null,'suburb','7e2a60cc-92b9-4a3b-8b40-d365c1df8e05');

-- Availability: weekdays for most; BBC lawn same-day weekdays; CCC lawn weekends; CCC dog includes Sat
insert into public.partner_availability_rules (
  partner_id, timezone, weekly_windows, blackouts, capacity_per_slot
) values
(
  'b1111111-1111-4111-8111-111111111201',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111202',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111203',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111301',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111302',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111303',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111401',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111402',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111403',
  'Australia/Brisbane',
  '[{"day":6,"start":"09:00","end":"17:00"},{"day":0,"start":"09:00","end":"16:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111501',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111502',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111503',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"},{"day":6,"start":"09:00","end":"15:00"}]'::jsonb,
  '[]'::jsonb, 2
);
