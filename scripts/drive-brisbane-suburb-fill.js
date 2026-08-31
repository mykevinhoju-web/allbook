/**
 * Drive Brisbane suburb Places fill with server-side chaining.
 * Client only kicks; Vercel continues via ?chain=1.
 *
 *   FILL_CATEGORIES=barber,nails,spa,hair node scripts/drive-brisbane-suburb-fill.js
 */
const fs = require("fs");
const path = require("path");

const tokenPath = path.resolve("tmp-maint-token.txt");
if (!fs.existsSync(tokenPath)) {
  console.error("Missing tmp-maint-token.txt");
  process.exit(1);
}
const token = fs.readFileSync(tokenPath, "utf8").trim();
const categories = (
  process.env.FILL_CATEGORIES || "barber,nails,spa,hair"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .join(",");
const kicks = Number(process.env.FILL_KICKS || 40);
const gapMs = Number(process.env.FILL_GAP_MS || 120_000);

function kick(i) {
  const url = `https://allbook.com.au/api/cron/brisbane-suburb-fill?categories=${encodeURIComponent(categories)}&batchSize=1&radiusKm=8&chain=1`;
  // Fire-and-forget — do not abort; server chains the rest.
  fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
    .then(async (res) => {
      const body = await res.json().catch(() => ({}));
      const item = body.result?.items?.[0];
      console.log(
        JSON.stringify({
          kick: i + 1,
          status: res.status,
          processed: body.result?.processed,
          skippedFresh: body.result?.skippedFresh,
          remaining: body.result?.remaining,
          done: body.result?.done,
          suburb: item?.suburb ?? null,
          category: item?.category ?? null,
          imported: item?.imported ?? null,
          updated: item?.updated ?? null,
        }),
      );
    })
    .catch((err) => {
      console.log(
        JSON.stringify({ kick: i + 1, error: String(err?.name || err) }),
      );
    });
}

(async () => {
  console.log(JSON.stringify({ starting: true, categories, kicks, gapMs }));
  for (let i = 0; i < kicks; i += 1) {
    kick(i);
    if (i < kicks - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  // Allow last response logs to flush
  await new Promise((r) => setTimeout(r, 90_000));
  console.log(JSON.stringify({ finishedKicks: true }));
})();
