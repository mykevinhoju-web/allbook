import { cn } from "@/lib/utils";

interface StaffFormSectionProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function StaffFormSection({
  title,
  description,
  className,
  children,
}: StaffFormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-6 shadow-sm sm:p-8",
        className,
      )}
    >
      <div className="mb-6 space-y-1 border-b border-border/40 pb-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
