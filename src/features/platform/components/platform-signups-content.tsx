import { AppCard } from "@/components/common";

import { listPlatformSignups } from "../server/list-signups";
import { PlatformPageHeader } from "./platform-page-header";
import { SignupsTable } from "./signups-table";

export async function PlatformSignupsContent() {
  const signups = await listPlatformSignups();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PlatformPageHeader
        title="Signups"
        description="Full list of businesses and owners who joined AllBook."
      />
      <AppCard className="border-border/60 p-4 shadow-soft sm:p-6">
        <SignupsTable
          tenants={signups}
          title="All signups"
          description={`${signups.length} business account${signups.length === 1 ? "" : "s"}.`}
        />
      </AppCard>
    </div>
  );
}
