import { PlatformPageHeader } from "./platform-page-header";

interface PlatformPlaceholderPageProps {
  title: string;
  description: string;
}

export function PlatformPlaceholderPage({
  title,
  description,
}: PlatformPlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PlatformPageHeader title={title} description={description} />
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/80 p-12 shadow-soft">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          This section is under construction. Functionality will be available in
          a future release.
        </p>
      </div>
    </div>
  );
}
