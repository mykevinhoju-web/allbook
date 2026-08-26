import { EverLandingStill } from "@/features/ever";
import { requireEverTenant } from "@/features/ever/server/require-ever-tenant";

export default async function EverRand2Page() {
  await requireEverTenant();
  return <EverLandingStill />;
}
