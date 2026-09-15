import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
  category: "restaurant" | "hair" | "nails" | "massage";
  source: "qldvision";
};

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

function digits(phone: string | null | undefined) {
  return (phone ?? "").replace(/\D/g, "");
}

function parseCards(
  html: string,
  category: DirectorySeed["category"],
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
    let name = clean(titleMatch[2] ?? "");
    // Strip nested English title block from the Korean heading.
    name = clean(name.replace(/<div[\s\S]*$/i, ""));
    if (!name || /adsbygoogle|window\.|최신 업데이트/.test(name)) continue;

    const titleEn = card.match(
      /class="[^"]*title_en[^"]*"[^>]*>\s*\(?\s*([^)<]{2,90})\s*\)?\s*</i,
    );
    if (titleEn) {
      name = clean(titleEn[1]);
    } else {
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

    const webMatch = card.match(
      /href="(https?:\/\/(?!www\.qldvision\.com\.au|www\.google\.com|pagead2)[^"]+)"/i,
    );
    const website = webMatch ? clean(webMatch[1]) : null;

    // Seed requires a matchable address (directory → Google Maps path).
    if (!address) continue;

    out.push({
      name,
      phone,
      address,
      mapsQuery,
      website,
      detailUrl,
      category,
      source: "qldvision",
    });
  }

  return out;
}

const files: Array<{ file: string; category: DirectorySeed["category"] }> = [
  { file: "qldvision-restaurant-bne.html", category: "restaurant" },
  { file: "qldvision-hair-bne.html", category: "hair" },
  { file: "qldvision-nail-bne.html", category: "nails" },
  { file: "qldvision-massage-bne.html", category: "massage" },
];

const categories: Record<string, DirectorySeed[]> = {};
for (const { file, category } of files) {
  const html = readFileSync(join(HTML_DIR, file), "utf8");
  const items = parseCards(html, category);
  const seen = new Set<string>();
  categories[category] = items.filter((item) => {
    const key = `${item.name.toLowerCase()}|${(item.address ?? "").toLowerCase()}|${digits(item.phone)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const payload = {
  source: "qldvision.com.au/upso?area=bne",
  generatedAt: new Date().toISOString(),
  scope: "Brisbane area only; seeds with street addresses for Places matching",
  note: "Public directory listings used as match seeds only. Google Places remains the catalogue source of truth.",
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

console.log(JSON.stringify(payload.counts, null, 2));
for (const [cat, items] of Object.entries(categories)) {
  console.log(`\n## ${cat} (${items.length})`);
  for (const item of items) {
    console.log(`- ${item.name} | ${item.address} | ${item.phone ?? "-"}`);
  }
}
