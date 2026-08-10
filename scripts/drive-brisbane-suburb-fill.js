/**
 * Drive production suburb fill sequentially from the client.
 * Each request fills 1 suburb; we space calls so Places can finish.
 *
 *   node scripts/drive-brisbane-suburb-fill.js
 */
const fs = require("fs");
const path = require("path");

const tokenPath = path.resolve("tmp-maint-token.txt");
if (!fs.existsSync(tokenPath)) {
  console.error("Missing tmp-maint-token.txt");
  process.exit(1);
}
const token = fs.readFileSync(tokenPath, "utf8").trim();
const total = Number(process.env.FILL_ROUNDS || 160);
const gapMs = Number(process.env.FILL_GAP_MS || 55_000);

async function oneRound(i) {
  const url =
    "https://allbook.com.au/api/cron/brisbane-suburb-fill?categories=hair&batchSize=1&radiusKm=8&chain=0";
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 90_000);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(timer);
    const body = await res.json().catch(() => ({}));
    const item = body.result?.items?.[0];
    console.log(
      JSON.stringify({
        round: i + 1,
        status: res.status,
        processed: body.result?.processed,
        skippedFresh: body.result?.skippedFresh,
        remaining: body.result?.remaining,
        done: body.result?.done,
        suburb: item?.suburb ?? null,
        fillStatus: item?.status ?? null,
        imported: item?.imported ?? null,
        updated: item?.updated ?? null,
      }),
    );
    return Boolean(body.result?.done);
  } catch (err) {
    clearTimeout(timer);
    console.log(
      JSON.stringify({
        round: i + 1,
        error: String(err?.name || err),
      }),
    );
    return false;
  }
}

(async () => {
  for (let i = 0; i < total; i += 1) {
    const done = await oneRound(i);
    if (done) {
      console.log(JSON.stringify({ finished: true, rounds: i + 1 }));
      break;
    }
    if (i < total - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
})();
