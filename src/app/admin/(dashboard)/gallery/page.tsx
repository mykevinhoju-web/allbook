import { AdminPlaceholderPage } from "@/features/admin";
import { ensureAdminModule } from "@/features/admin/server/ensure-admin-module";

export default async function AdminGalleryPage() {
  await ensureAdminModule("gallery");
  return (
    <AdminPlaceholderPage
      title="Gallery"
      description="Manage shop images and media assets."
    />
  );
}
