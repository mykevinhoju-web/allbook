-- Seed: Brisbane suburbs (idempotent by name + city + state)
-- Columns used: name, postcode, latitude, longitude

insert into public.suburbs (name, postcode, city, state, country, latitude, longitude)
select
  v.name,
  v.postcode,
  'Brisbane',
  'QLD',
  'Australia',
  v.latitude,
  v.longitude
from (values
  ('Aspley', '4034', -27.3632::float8, 153.0164::float8),
  ('Chermside', '4032', -27.3849::float8, 153.0312::float8),
  ('Sunnybank', '4109', -27.5704::float8, 153.0608::float8),
  ('Indooroopilly', '4068', -27.4992::float8, 152.9726::float8),
  ('Carindale', '4152', -27.5030::float8, 153.1020::float8),
  ('New Farm', '4005', -27.4676::float8, 153.0489::float8),
  ('Paddington', '4064', -27.4590::float8, 152.9990::float8),
  ('Fortitude Valley', '4006', -27.4570::float8, 153.0350::float8),
  ('Albany Creek', '4035', -27.3480::float8, 152.9680::float8),
  ('North Lakes', '4509', -27.2400::float8, 153.0160::float8)
) as v(name, postcode, latitude, longitude)
where not exists (
  select 1
  from public.suburbs s
  where s.name = v.name
    and s.city = 'Brisbane'
    and s.state = 'QLD'
);
