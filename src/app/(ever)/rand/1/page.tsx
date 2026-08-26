import { EverLandingNocturne } from "@/features/ever";
import { requireEverTenant } from "@/features/ever/server/require-ever-tenant";

export default async function EverRand1Page() {
  await requireEverTenant();
  return <EverLandingNocturne />;
}
