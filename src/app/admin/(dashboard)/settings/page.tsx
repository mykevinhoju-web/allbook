import { AdminPlaceholderPage } from "@/features/admin";
import { ensureAdminModule } from "@/features/admin/server/ensure-admin-module";

export default async function AdminSettingsPage() {
  await ensureAdminModule("settings");
  return (
    <AdminPlaceholderPage
      title="Settings"
      description="Configure platform settings and preferences."
    />
  );
}
