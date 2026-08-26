import { SpaSampleStill } from "@/features/spa-landing";
import { requireEverTenant } from "@/features/spa-landing/server/require-ever-tenant";

export default async function EverRand2Page() {
  await requireEverTenant();
  return <SpaSampleStill />;
}
