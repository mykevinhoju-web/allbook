/**
 * Reset + seed Marketplace demo partners in Supabase.
 * Dev / non-production only. Prefer: npx tsx scripts/seed-marketplace-demo.ts
 *
 * This SQL is also applied via MCP for environments without a local service role.
 */

-- Wipe previous demo graph
delete from public.request_matches where is_demo = true;
delete from public.service_requests where is_demo = true;
delete from public.marketplace_partners where is_demo = true;

-- Remove prior demo auth users (cascade partners already deleted)
delete from auth.identities
where user_id in (
  select id from auth.users where email like '%@allbook.demo'
);
delete from auth.users where email like '%@allbook.demo';

-- Auth users (stable ids)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
) values
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111101',
  'authenticated', 'authenticated', 'john.lawn@allbook.demo',
  crypt('demo-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo":true}'::jsonb,
  false, '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111102',
  'authenticated', 'authenticated', 'green.grass@allbook.demo',
  crypt('demo-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo":true}'::jsonb,
  false, '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111103',
  'authenticated', 'authenticated', 'abc.cleaning@allbook.demo',
  crypt('demo-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo":true}'::jsonb,
  false, '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111104',
  'authenticated', 'authenticated', 'sarah.beauty@allbook.demo',
  crypt('demo-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo":true}'::jsonb,
  false, '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111105',
  'authenticated', 'authenticated', 'brisbane.auto@allbook.demo',
  crypt('demo-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo":true}'::jsonb,
  false, '', '', '', ''
);

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  u.id, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', u.id::text, now(), now(), now()
from auth.users u
where u.email like '%@allbook.demo';

-- Partners
insert into public.marketplace_partners (
  id, auth_user_id, salon_id, partner_type, status, display_name, bio, email, is_demo, verified_at
) values
(
  'b1111111-1111-4111-8111-111111111101',
  'a1111111-1111-4111-8111-111111111101',
  null, 'independent', 'active', 'John''s Lawn Care',
  'Demo lawn care partner', 'john.lawn@allbook.demo', true, now()
),
(
  'b1111111-1111-4111-8111-111111111102',
  'a1111111-1111-4111-8111-111111111102',
  null, 'independent', 'active', 'Green Grass AU',
  'Demo lawn care partner', 'green.grass@allbook.demo', true, now()
),
(
  'b1111111-1111-4111-8111-111111111103',
  'a1111111-1111-4111-8111-111111111103',
  null, 'independent', 'active', 'ABC Cleaning',
  'Demo cleaning partner', 'abc.cleaning@allbook.demo', true, now()
),
(
  'b1111111-1111-4111-8111-111111111104',
  'a1111111-1111-4111-8111-111111111104',
  null, 'independent', 'active', 'Sarah Beauty',
  'Demo beauty partner', 'sarah.beauty@allbook.demo', true, now()
),
(
  'b1111111-1111-4111-8111-111111111105',
  'a1111111-1111-4111-8111-111111111105',
  null, 'independent', 'active', 'Brisbane Mobile Auto',
  'Demo auto partner', 'brisbane.auto@allbook.demo', true, now()
);

-- Services
insert into public.partner_services (
  id, partner_id, category_slug, name, pricing_type, price_cents, currency, duration_minutes, is_active
) values
('c1111111-1111-4111-8111-111111111101', 'b1111111-1111-4111-8111-111111111101', 'lawn_care', 'Lawn Mowing', 'fixed', 7000, 'AUD', 60, true),
('c1111111-1111-4111-8111-111111111102', 'b1111111-1111-4111-8111-111111111102', 'lawn_care', 'Lawn Mowing', 'fixed', 5500, 'AUD', 60, true),
('c1111111-1111-4111-8111-111111111103', 'b1111111-1111-4111-8111-111111111103', 'cleaning', 'House Cleaning', 'fixed', 9000, 'AUD', 120, true),
('c1111111-1111-4111-8111-111111111104', 'b1111111-1111-4111-8111-111111111104', 'nail', 'Nail Trim', 'fixed', 2000, 'AUD', 30, true),
('c1111111-1111-4111-8111-111111111105', 'b1111111-1111-4111-8111-111111111105', 'automotive', 'Mobile Car Wash', 'fixed', 6000, 'AUD', 45, true);

-- Areas (suburb mode)
insert into public.partner_service_areas (
  id, partner_id, service_id, mode, suburb_id
) values
('d1111111-1111-4111-8111-111111111101', 'b1111111-1111-4111-8111-111111111101', null, 'suburb', '6b42bb67-8b42-4ce1-a07f-2702eeb58451'),
('d1111111-1111-4111-8111-111111111102', 'b1111111-1111-4111-8111-111111111102', null, 'suburb', '6b42bb67-8b42-4ce1-a07f-2702eeb58451'),
('d1111111-1111-4111-8111-111111111103', 'b1111111-1111-4111-8111-111111111103', null, 'suburb', '6b42bb67-8b42-4ce1-a07f-2702eeb58451'),
('d1111111-1111-4111-8111-111111111104', 'b1111111-1111-4111-8111-111111111104', null, 'suburb', '159084d9-9ac3-4fb3-9a43-7fc502d06698'),
('d1111111-1111-4111-8111-111111111105', 'b1111111-1111-4111-8111-111111111105', null, 'suburb', '6b42bb67-8b42-4ce1-a07f-2702eeb58451');

-- Availability
insert into public.partner_availability_rules (
  partner_id, timezone, weekly_windows, blackouts, capacity_per_slot
) values
(
  'b1111111-1111-4111-8111-111111111101',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 1
),
(
  'b1111111-1111-4111-8111-111111111102',
  'Australia/Brisbane',
  '[{"day":1,"start":"13:00","end":"18:00"},{"day":2,"start":"13:00","end":"18:00"},{"day":3,"start":"13:00","end":"18:00"},{"day":4,"start":"13:00","end":"18:00"},{"day":5,"start":"13:00","end":"18:00"}]'::jsonb,
  '[]'::jsonb, 1
),
(
  'b1111111-1111-4111-8111-111111111103',
  'Australia/Brisbane',
  '[{"day":2,"start":"10:00","end":"16:00"},{"day":4,"start":"10:00","end":"16:00"}]'::jsonb,
  '[]'::jsonb, 1
),
(
  'b1111111-1111-4111-8111-111111111104',
  'Australia/Brisbane',
  '[{"day":1,"start":"10:00","end":"18:00"},{"day":2,"start":"10:00","end":"18:00"},{"day":3,"start":"10:00","end":"18:00"},{"day":4,"start":"10:00","end":"18:00"},{"day":5,"start":"10:00","end":"18:00"},{"day":6,"start":"10:00","end":"18:00"}]'::jsonb,
  '[]'::jsonb, 1
),
(
  'b1111111-1111-4111-8111-111111111105',
  'Australia/Brisbane',
  '[{"day":0,"start":"09:00","end":"17:00"},{"day":6,"start":"09:00","end":"17:00"}]'::jsonb,
  '[]'::jsonb, 1
);
