/**
 * Drive production service enrichment (tags + draft menus) until done.
 *
 *   node scripts/drive-service-enrichment.js
 */
const fs = require("fs");
const path = require("path");

const tokenPath = path.resolve("tmp-maint-token.txt");
if (!fs.existsSync(tokenPath)) {
  console.error("Missing tmp-maint-token.txt");
  process.exit(1);
}
const token = fs.readFileSync(tokenPath, "utf8").trim();
const total = Number(process.env.ENRICH_ROUNDS || 3000);
const gapMs = Number(process.env.ENRICH_GAP_MS || 20_000);
const batchSize = Number(process.env.ENRICH_BATCH || 2);

async function oneRound(i) {
  const url = `https://allbook.com.au/api/cron/enrich-salon-services?batchSize=${batchSize}&chain=0`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 120_000);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(timer);
    const body = await res.json().catch(() => ({}));
    console.log(
      JSON.stringify({
        round: i + 1,
        status: res.status,
        processed: body.result?.processed,
        remaining: body.result?.remainingEstimate,
        done: body.result?.done,
        totals: body.result?.totals,
        sample: (body.result?.items || []).slice(0, 2).map((x) => ({
          name: x.name,
          status: x.status,
          servicesInserted: x.servicesInserted,
          tagsApplied: x.tagsApplied,
        })),
      }),
    );
    return Boolean(body.result?.done);
  } catch (err) {
    clearTimeout(timer);
    console.log(
      JSON.stringify({ round: i + 1, error: String(err?.name || err) }),
    );
    return false;
  }
}

(async () => {
  console.log(JSON.stringify({ starting: true, total, gapMs, batchSize }));
  for (let i = 0; i < total; i += 1) {
    const done = await oneRound(i);
    if (done) {
      console.log(JSON.stringify({ finished: true, rounds: i + 1 }));
      break;
    }
    if (i < total - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
})();
