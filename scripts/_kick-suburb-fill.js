const fs = require("fs");
const token = fs.readFileSync("tmp-maint-token.txt", "utf8").trim();
const url =
  "https://allbook.com.au/api/cron/brisbane-suburb-fill?categories=hair&batchSize=1&radiusKm=8&chain=1";
// Fire-and-forget: server keeps chaining; don't wait for Places latency.
fetch(url, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
  cache: "no-store",
}).catch(() => {});
console.log(JSON.stringify({ kicked: true, batchSize: 1, chain: true }));
setTimeout(() => process.exit(0), 2000);
