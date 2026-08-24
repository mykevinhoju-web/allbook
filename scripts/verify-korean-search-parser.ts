/**
 * Parser checks for Korean home examples.
 * Run: npx tsx scripts/verify-korean-search-parser.ts
 */
import assert from "node:assert/strict";

import { parseKoreanQuery } from "../src/features/korean-search/parse-korean-query";

const cases = [
  {
    q: "싼 미용실 찾아줘",
    service: "Hair",
    sort: "price",
    location: "Brisbane City",
  },
  {
    q: "평점 높은 미용실 찾아줘",
    service: "Hair",
    sort: "rating",
    minRating: 4,
  },
  {
    q: "가까운 미용실 찾아줘",
    service: "Hair",
    sort: "distance",
  },
  {
    q: "브리즈번 미용실",
    service: "Hair",
    location: "Brisbane City",
  },
  {
    q: "Sunnybank 미용실",
    service: "Hair",
    location: "Sunnybank",
  },
] as const;

for (const c of cases) {
  const parsed = parseKoreanQuery(c.q);
  assert.equal(parsed.service, c.service, c.q);
  if ("sort" in c && c.sort) {
    assert.equal(parsed.sort, c.sort, c.q);
  }
  if ("location" in c && c.location) {
    assert.equal(parsed.location, c.location, c.q);
  }
  if ("minRating" in c) {
    assert.equal(parsed.minRating, c.minRating, c.q);
  }
  console.log(`PASS ${c.q} → ${parsed.service} / ${parsed.location} / ${parsed.sort}`);
}

console.log("verify-korean-search-parser: ok");
