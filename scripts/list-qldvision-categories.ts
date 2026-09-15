import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "data/korean-directory";
mkdirSync(DIR, { recursive: true });

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function main() {
  const indexHtml = await fetchText("https://www.qldvision.com.au/upso?area=bne");
  writeFileSync(join(DIR, "qldvision-index-bne.html"), indexHtml, "utf8");

  const sca = new Set<string>();
  const re = /\/upso\?sca=([^"&]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(indexHtml))) {
    sca.add(decodeURIComponent(m[1]));
  }

  const labeled: Array<{ sca: string; label: string }> = [];
  const linkRe =
    /<a[^>]*href="[^"]*\/upso\?sca=([^"&]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(indexHtml))) {
    const key = decodeURIComponent(m[1]);
    const label = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (label && label.length < 40) labeled.push({ sca: key, label });
  }

  console.log(
    JSON.stringify(
      {
        uniqueSca: [...sca].sort(),
        labeled: labeled.slice(0, 120),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
