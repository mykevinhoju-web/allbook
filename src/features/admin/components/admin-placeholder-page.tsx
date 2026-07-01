import { AdminPageHeader } from "@/features/admin";

interface AdminPlaceholderPageProps {
  title: string;
  description: string;
}

export function AdminPlaceholderPage({
  title,
  description,
}: AdminPlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader title={title} description={description} />
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed bg-card/50 p-12">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          This section is under construction. Functionality will be available in
          a future release.
        </p>
      </div>
    </div>
  );
}
