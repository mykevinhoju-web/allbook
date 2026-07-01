import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionCardProps extends React.ComponentProps<typeof Card> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  footer,
  headerAction,
  contentClassName,
  className,
  children,
  ...props
}: SectionCardProps) {
  const hasHeader = title || description || headerAction;

  return (
    <Card
      className={cn("rounded-xl shadow-soft ring-1 ring-border/60", className)}
      {...props}
    >
      {hasHeader ? (
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <CardTitle>{title}</CardTitle> : null}
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {headerAction}
        </CardHeader>
      ) : null}
      <CardContent className={cn(hasHeader ? undefined : "pt-6", contentClassName)}>
        {children}
      </CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
