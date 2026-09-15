import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const HTML_DIR = "data/korean-directory";
const OUT_JSON =
  "src/features/google-import/data/brisbane-korean-directory-seeds.json";

export type DirectorySeed = {
  name: string;
  phone: string | null;
  address: string | null;
  mapsQuery: string | null;
  website: string | null;
  detailUrl: string | null;
  category: string;
  directoryCategory: string;
  source: "qldvision";
};

/** QLDVision sca label → AllBook marketplace category slug */
const DIRECTORY_CATEGORY_MAP: Record<string, string> = {
  식당: "restaurant",
  떡집: "mart",
  정육점: "mart",
  미용실: "hair",
  "병원,치과": "medical",
  안경점: "medical",
  "심리상담,치료": "medical",
  "유학,학원,레슨": "academy",
  "노래방,당구장": "entertainment",
  "스포츠,골프": "entertainment",
  변호사: "services",
  회계: "services",
  부동산: "services",
  "보험,파이낸스": "services",
  "번역,통역": "services",
  자동차정비: "services",
  "청소,방역": "services",
  "택배,배달,이사": "services",
  "여행,픽업": "services",
  에어컨: "services",
  "전기,솔라": "services",
  "건축,인테리어": "services",
  "간판,인쇄": "services",
  "패션,옷수선": "services",
  // Skip reference lists / churches for catalogue matching
};

const SKIP_SCA = new Set(["[주요한인기관]", "[호주주요번호]", "종교"]);

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function clean(s: string) {
  return decodeEntities(s).replace(/\s+/g, " ").trim();
}

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

const OUTSIDE_BRISBANE =
  /southport|surfers|broadbeach|robina|burleigh|nerang|varsity|parkwood|coolum|noosa|mudgeeraba|4215|4217|4220|4227|4567|4573/i;

function parseCards(
  html: string,
  category: string,
  directoryCategory: string,
): DirectorySeed[] {
  const cards = html.split(/<div class="card">/i).slice(1);
  const out: DirectorySeed[] = [];

  for (const card of cards) {
    if (/text-bg-secondary">\s*골코/i.test(card)) continue;

    const titleMatch = card.match(
      /<h5 class="card-title">\s*<a href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>\s*<\/h5>/i,
    );
    if (!titleMatch) continue;

    const detailHref = decodeEntities(titleMatch[1] ?? "");
    const detailUrl = detailHref.startsWith("http")
      ? detailHref
      : `https://www.qldvision.com.au${detailHref}`;
    let name = clean((titleMatch[2] ?? "").replace(/<div[\s\S]*$/i, ""));
    if (
      !name ||
      /adsbygoogle|window\.|google_ad|최신 업데이트|^\s*\[\s*\]/i.test(name)
    ) {
      continue;
    }

    const titleEn = card.match(
      /class="[^"]*title_en[^"]*"[^>]*>\s*\(?\s*([^)<]{2,90})\s*\)?\s*</i,
    );
    if (titleEn) name = clean(titleEn[1]);
    else {
      const parenEn = card.match(/\(([A-Za-z][^)]{2,90})\)/);
      if (parenEn) name = clean(parenEn[1]);
    }

    const phoneMatch = card.match(/href="tel:([^"]+)"/i);
    const phone = phoneMatch ? clean(phoneMatch[1]) : null;

    const mapsMatch = card.match(
      /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=([^"]+)"/i,
    );
    let mapsQuery: string | null = null;
    let address: string | null = null;
    if (mapsMatch) {
      mapsQuery = decodeURIComponent(mapsMatch[1].replace(/\+/g, " "));
      address = clean(mapsQuery);
    }

    if (address && OUTSIDE_BRISBANE.test(address)) continue;

    const webMatch = card.match(
      /href="(https?:\/\/(?!www\.qldvision\.com\.au|www\.google\.com|pagead2)[^"]+)"/i,
    );
    const website = webMatch ? clean(webMatch[1]) : null;

    // Prefer address; allow phone-only seeds (matched via name + Brisbane).
    if (!address && !phone) continue;

    out.push({
      name,
      phone,
      address,
      mapsQuery,
      website,
      detailUrl,
      category,
      directoryCategory,
      source: "qldvision",
    });
  }

  return out;
}

async function listDirectoryCategories(): Promise<string[]> {
  const html = await fetchText("https://www.qldvision.com.au/upso?area=bne");
  writeFileSync(join(HTML_DIR, "qldvision-index-bne.html"), html, "utf8");
  const set = new Set<string>();
  const re = /\/upso\?sca=([^"&]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    set.add(decodeURIComponent(m[1]));
  }
  return [...set].filter((sca) => !SKIP_SCA.has(sca) && DIRECTORY_CATEGORY_MAP[sca]);
}

async function main() {
  mkdirSync(HTML_DIR, { recursive: true });
  const scaList = await listDirectoryCategories();
  const categories: Record<string, DirectorySeed[]> = {};

  for (const sca of scaList) {
    const mapped = DIRECTORY_CATEGORY_MAP[sca]!;
    const url = `https://www.qldvision.com.au/upso?sca=${encodeURIComponent(sca)}&area=bne`;
    const html = await fetchText(url);
    const safe = sca.replace(/[^\w가-힣]+/g, "-");
    writeFileSync(join(HTML_DIR, `qldvision-${safe}-bne.html`), html, "utf8");
    const items = parseCards(html, mapped, sca);
    for (const item of items) {
      (categories[mapped] ??= []).push(item);
    }
    console.log(`${sca} → ${mapped}: ${items.length} seeds`);
    await new Promise((r) => setTimeout(r, 250));
  }

  // Dedupe within each category + drop ad/script junk
  for (const [cat, items] of Object.entries(categories)) {
    const seen = new Set<string>();
    categories[cat] = items.filter((item) => {
      if (/adsbygoogle|window\.adsbygoogle|google_ad/i.test(item.name)) {
        return false;
      }
      const key = `${item.name.toLowerCase()}|${(item.address ?? "").toLowerCase()}|${item.phone ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const payload = {
    source: "qldvision.com.au/upso?area=bne",
    generatedAt: new Date().toISOString(),
    scope: "Brisbane area — all mapped QLDVision categories with street addresses",
    note: "Public directory listings used as match seeds only. Google Places remains the catalogue source of truth.",
    directoryCategories: scaList,
    counts: Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [k, v.length]),
    ),
    categories,
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  writeFileSync(
    join(HTML_DIR, "brisbane-seeds.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  console.log("\nTotals:");
  console.log(JSON.stringify(payload.counts, null, 2));
  for (const [cat, items] of Object.entries(categories)) {
    console.log(`\n## ${cat} (${items.length})`);
    for (const item of items.slice(0, 6)) {
      console.log(
        `- [${item.directoryCategory}] ${item.name} | ${item.address}`,
      );
    }
    if (items.length > 6) console.log(`  ... +${items.length - 6} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
