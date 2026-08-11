-- Bridgeman Downs hair demo partners (additive — does not wipe lawn demos).
-- Canonical English amenities: disability_accessible | kids_care | parking

-- Clean previous hair demo rows only
delete from public.marketplace_partners
where id in (
  'b1111111-1111-4111-8111-111111111201',
  'b1111111-1111-4111-8111-111111111202',
  'b1111111-1111-4111-8111-111111111203'
);

delete from auth.identities
where user_id in (
  'a1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111203'
);

delete from auth.users
where id in (
  'a1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111203'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
) values
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111201',
  'authenticated', 'authenticated', 'abc.hair@allbook.demo',
  crypt('demo-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo":true}'::jsonb,
  false, '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111202',
  'authenticated', 'authenticated', 'bbc.hair@allbook.demo',
  crypt('demo-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo":true}'::jsonb,
  false, '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111203',
  'authenticated', 'authenticated', 'ccc.hair@allbook.demo',
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
where u.id in (
  'a1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111203'
);

-- Bridgeman Downs suburb id: 7e2a60cc-92b9-4a3b-8b40-d365c1df8e05
insert into public.marketplace_partners (
  id, auth_user_id, salon_id, partner_type, status, display_name, bio, email,
  address, latitude, longitude, amenities, is_demo, verified_at
) values
(
  'b1111111-1111-4111-8111-111111111201',
  'a1111111-1111-4111-8111-111111111201',
  null, 'independent', 'active', 'ABC Hair',
  'Family-friendly salon with disability access in Bridgeman Downs.',
  'abc.hair@allbook.demo',
  '12 Albany Creek Road, Bridgeman Downs QLD 4035',
  -27.3542, 153.0015,
  array['disability_accessible']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111202',
  'a1111111-1111-4111-8111-111111111202',
  null, 'independent', 'active', 'BBC Hair',
  'Kids-friendly hair salon in Bridgeman Downs.',
  'bbc.hair@allbook.demo',
  '45 Beckett Road, Bridgeman Downs QLD 4035',
  -27.3561, 152.9988,
  array['kids_care']::text[],
  true, now()
),
(
  'b1111111-1111-4111-8111-111111111203',
  'a1111111-1111-4111-8111-111111111203',
  null, 'independent', 'active', 'CCC Hair',
  'Salon with on-site parking in Bridgeman Downs.',
  'ccc.hair@allbook.demo',
  '88 Bridgeman Road, Bridgeman Downs QLD 4035',
  -27.3535, 153.0042,
  array['parking']::text[],
  true, now()
);

insert into public.partner_services (
  id, partner_id, category_slug, name, pricing_type, price_cents, currency, duration_minutes, is_active, attributes
) values
(
  'c1111111-1111-4111-8111-111111111201',
  'b1111111-1111-4111-8111-111111111201',
  'hair', 'Hair Cut', 'fixed', 4500, 'AUD', 45, true,
  '{"amenity":"disability_accessible"}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111202',
  'b1111111-1111-4111-8111-111111111202',
  'hair', 'Hair Cut', 'fixed', 6500, 'AUD', 45, true,
  '{"amenity":"kids_care"}'::jsonb
),
(
  'c1111111-1111-4111-8111-111111111203',
  'b1111111-1111-4111-8111-111111111203',
  'hair', 'Hair Cut', 'fixed', 5500, 'AUD', 45, true,
  '{"amenity":"parking"}'::jsonb
);

insert into public.partner_service_areas (
  id, partner_id, service_id, mode, suburb_id
) values
(
  'd1111111-1111-4111-8111-111111111201',
  'b1111111-1111-4111-8111-111111111201',
  null, 'suburb', '7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'
),
(
  'd1111111-1111-4111-8111-111111111202',
  'b1111111-1111-4111-8111-111111111202',
  null, 'suburb', '7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'
),
(
  'd1111111-1111-4111-8111-111111111203',
  'b1111111-1111-4111-8111-111111111203',
  null, 'suburb', '7e2a60cc-92b9-4a3b-8b40-d365c1df8e05'
);

insert into public.partner_availability_rules (
  partner_id, timezone, weekly_windows, blackouts, capacity_per_slot
) values
(
  'b1111111-1111-4111-8111-111111111201',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"},{"day":6,"start":"09:00","end":"16:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111202',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"},{"day":6,"start":"09:00","end":"16:00"}]'::jsonb,
  '[]'::jsonb, 2
),
(
  'b1111111-1111-4111-8111-111111111203',
  'Australia/Brisbane',
  '[{"day":1,"start":"09:00","end":"17:00"},{"day":2,"start":"09:00","end":"17:00"},{"day":3,"start":"09:00","end":"17:00"},{"day":4,"start":"09:00","end":"17:00"},{"day":5,"start":"09:00","end":"17:00"},{"day":6,"start":"09:00","end":"16:00"}]'::jsonb,
  '[]'::jsonb, 2
);
