/**
 * Parser checks for Korean home examples.
 * Run: npx tsx scripts/verify-korean-search-parser.ts
 */
import assert from "node:assert/strict";

import {
  formatKoreanSearchCriteria,
  parseKoreanQuery,
} from "../src/features/korean-search/parse-korean-query";

const cases = [
  {
    q: "싼 미용실 찾아줘",
    service: "Hair",
    serviceLabel: "미용실",
    sort: "price",
    location: "",
    priceLow: true,
  },
  {
    q: "평점 높은 미용실",
    service: "Hair",
    sort: "rating",
    ratingHigh: true,
    minRating: null,
  },
  {
    q: "Sunnybank 근처 미용실",
    service: "Hair",
    location: "Sunnybank",
    sort: "distance",
    near: true,
  },
  {
    q: "오늘 예약 가능한 미용실",
    service: "Hair",
    bookableOnly: true,
  },
  {
    q: "가까운 미용실 찾아줘",
    service: "Hair",
    sort: "distance",
    near: true,
    location: "",
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
  assert.equal(parsed.minRating, null, `${c.q} minRating`);
  assert.equal(
    parsed.bookableOnly,
    "bookableOnly" in c ? c.bookableOnly : false,
    c.q,
  );
  if ("sort" in c && c.sort) {
    assert.equal(parsed.sort, c.sort, c.q);
  }
  if ("location" in c) {
    assert.equal(parsed.location, c.location, c.q);
  }
  if ("priceLow" in c) {
    assert.equal(parsed.priceLow, c.priceLow, c.q);
  }
  if ("ratingHigh" in c) {
    assert.equal(parsed.ratingHigh, c.ratingHigh, c.q);
  }
  if ("near" in c) {
    assert.equal(parsed.near, c.near, c.q);
  }
  if ("serviceLabel" in c) {
    assert.equal(parsed.serviceLabel, c.serviceLabel, c.q);
  }
  const chips = formatKoreanSearchCriteria(parsed);
  if (parsed.serviceLabel) {
    assert.ok(chips.some((chip) => chip.label === "업종"));
  }
  console.log(
    `PASS ${c.q} → ${parsed.serviceLabel ?? "-"} / ${parsed.location || "-"} / ${parsed.sort}`,
  );
}

console.log("verify-korean-search-parser: ok");
