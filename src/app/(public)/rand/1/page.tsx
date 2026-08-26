import { SpaSampleNocturne } from "@/features/spa-landing";
import { requireEverTenant } from "@/features/spa-landing/server/require-ever-tenant";

export default async function EverRand1Page() {
  await requireEverTenant();
  return <SpaSampleNocturne />;
}
