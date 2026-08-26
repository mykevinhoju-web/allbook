import { EverLandingVerdant } from "@/features/ever";
import { requireEverTenant } from "@/features/ever/server/require-ever-tenant";

export default async function EverRand3Page() {
  await requireEverTenant();
  return <EverLandingVerdant />;
}
