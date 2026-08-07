import { writeFileSync } from "node:fs";
import { BRISBANE_SUBURBS } from "../src/features/search/brisbane-suburbs";

const values = BRISBANE_SUBURBS.map(
  (s) =>
    `  ('${s.name.replace(/'/g, "''")}', '${s.postcode}', ${s.latitude}::float8, ${s.longitude}::float8)`,
).join(",\n");

const sql = `-- Expand Greater Brisbane suburbs catalogue (idempotent by name + city + state).

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
${values}
) as v(name, postcode, latitude, longitude)
where not exists (
  select 1
  from public.suburbs s
  where s.name = v.name
    and s.city = 'Brisbane'
    and s.state = 'QLD'
);
`;

writeFileSync(
  "supabase/migrations/20260807232000_expand_brisbane_suburbs_catalogue.sql",
  sql,
);
writeFileSync("supabase/seeds/002_brisbane_suburbs.sql", sql);
console.log(`Wrote ${BRISBANE_SUBURBS.length} suburbs`);
