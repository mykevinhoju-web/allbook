/**
 * Pre-compile common admin routes after `npm run dev` is ready.
 * Usage: node scripts/warm-dev.mjs   (in a second terminal)
 */
const base = process.env.DEV_URL ?? "http://localhost:3000";
const routes = [
  "/admin/login",
  "/admin",
  "/admin/staff",
  "/admin/bookings",
  "/api/admin/auth/me",
  "/api/admin/staff",
];

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${base}/admin/login`);
      if (response.ok) return;
    } catch {
      // server not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Dev server did not respond at ${base}`);
}

async function warm() {
  console.log(`Warming ${base} ...`);
  await waitForServer();
  await Promise.all(
    routes.map(async (route) => {
      const started = Date.now();
      try {
        const response = await fetch(`${base}${route}`);
        console.log(`${response.status} ${route} (${Date.now() - started}ms)`);
      } catch (error) {
        console.log(`ERR ${route}`, error);
      }
    }),
  );
  console.log("Warm-up done — pages should load faster now.");
}

void warm();
