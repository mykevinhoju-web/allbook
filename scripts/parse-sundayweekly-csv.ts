import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const DEFAULT_CSV =
  "d:/Down/DOWN3/sundayweekly_qld_2026-09-11_business_db_ALL.csv";
const OUT_JSON =
  "src/features/google-import/data/sundayweekly-qld-directory-seeds.json";
const RAW_COPY = "data/korean-directory/sundayweekly_qld_2026-09-11_business_db_ALL.csv";

type Seed = {
  name: string;
  phone: string | null;
  address: string | null;
  mapsQuery: string | null;
  website: string | null;
  detailUrl: string | null;
  category: string;
  directoryCategory: string;
  source: "sundayweekly";
  confidence: string | null;
};

/** Sunday Weekly category label → AllBook marketplace slug */
const CATEGORY_MAP: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /식당|카페|음식|베이커|떡|한식|bbq|바비큐/i, category: "restaurant" },
  { pattern: /마트|식품|포장|정육|슈퍼/, category: "mart" },
  { pattern: /네일|피부/, category: "nails" },
  { pattern: /미용|헤어|뷰티|바버/, category: "hair" },
  { pattern: /병원|의료|치과|한의|물리치료|안경|상담|케어|헬스|동물/, category: "medical" },
  { pattern: /학원|교육|유학|레슨|스포츠|골프/, category: "academy" },
  { pattern: /노래방|당구|엔터|레저|PC/, category: "entertainment" },
  {
    pattern:
      /법률|변호|회계|세무|부동산|건축|리노|플러밍|전기|바닥|청소|방역|자동차|정비|틴팅|이사|택배|여행|픽업|보험|파이낸스|광고|간판|인쇄|디자인|에어컨|냉방|냉동|사진|영상|패션|옷수선|통역|번역|종교|결혼|주례|이벤트/,
    category: "services",
  },
];

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i]!;
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === "," && !q) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function mapCategory(label: string): string {
  for (const row of CATEGORY_MAP) {
    if (row.pattern.test(label)) return row.category;
  }
  return "services";
}

function main() {
  const csvPath = resolve(process.argv[2] || DEFAULT_CSV);
  if (!existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  mkdirSync(dirname(RAW_COPY), { recursive: true });
  try {
    copyFileSync(csvPath, RAW_COPY);
  } catch {
    // optional local cache
  }

  const raw = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = splitCsv(lines[0]!);
  const isAll = header[0] === "db_id";

  const categories: Record<string, Seed[]> = {};
  let skippedNoPhone = 0;
  let skippedNoName = 0;

  for (const line of lines.slice(1)) {
    const cols = splitCsv(line);
    const directoryCategory = (isAll ? cols[3] : cols[2] ?? "").trim();
    const name = (isAll ? cols[4] : cols[3] ?? "").trim();
    const phone = (isAll ? cols[5] : cols[4] ?? "").trim() || null;
    const confidence = (isAll ? cols[7] : cols[6] ?? "").trim() || null;

    if (!name) {
      skippedNoName += 1;
      continue;
    }
    // Phone-first seed: address filled later via Places.
    if (!phone) {
      skippedNoPhone += 1;
      continue;
    }

    const category = mapCategory(directoryCategory);
    const seed: Seed = {
      name,
      phone,
      address: null,
      mapsQuery: null,
      website: null,
      detailUrl: null,
      category,
      directoryCategory,
      source: "sundayweekly",
      confidence,
    };
    (categories[category] ??= []).push(seed);
  }

  // Dedupe by name+phone within category
  for (const [cat, items] of Object.entries(categories)) {
    const seen = new Set<string>();
    categories[cat] = items.filter((item) => {
      const key = `${item.name.toLowerCase()}|${(item.phone ?? "").replace(/\D/g, "")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const counts = Object.fromEntries(
    Object.entries(categories).map(([k, v]) => [k, v.length]),
  );
  const payload = {
    source: "Sunday Weekly QLD, 11 Sep 2026 business DB (ALL)",
    generatedAt: new Date().toISOString(),
    scope:
      "QLD Korean business contacts with phone; address resolved later via Google Places",
    note: "Seed contacts only. Google Places remains catalogue source of truth for address/geo.",
    csvPath,
    skippedNoPhone,
    skippedNoName,
    counts,
    categories,
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  writeFileSync(
    join("data/korean-directory", "sundayweekly-qld-seeds.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  console.log(JSON.stringify({ counts, skippedNoPhone, skippedNoName }, null, 2));
  for (const [cat, items] of Object.entries(categories)) {
    console.log(`\n## ${cat} (${items.length})`);
    for (const item of items.slice(0, 4)) {
      console.log(`- ${item.name} | ${item.phone} | ${item.directoryCategory}`);
    }
  }
}

main();
