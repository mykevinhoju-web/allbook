import { SpaSampleVerdant } from "@/features/spa-landing";
import { requireEverTenant } from "@/features/spa-landing/server/require-ever-tenant";

export default async function EverRand3Page() {
  await requireEverTenant();
  return <SpaSampleVerdant />;
}
