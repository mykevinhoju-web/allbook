import { AdminCustomersContent } from "@/features/admin";
import { ensureAdminModule } from "@/features/admin/server/ensure-admin-module";

export default async function AdminCustomersPage() {
  await ensureAdminModule("customers");
  return <AdminCustomersContent />;
}
