interface PlatformPageHeaderProps {
  title: string;
  description?: string;
}

export function PlatformPageHeader({
  title,
  description,
}: PlatformPageHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
