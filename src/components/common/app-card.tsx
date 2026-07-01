import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function AppCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "rounded-xl border-border/60 bg-card shadow-soft ring-0",
        className,
      )}
      {...props}
    />
  );
}

export {
  AppCard,
  CardContent as AppCardContent,
  CardDescription as AppCardDescription,
  CardFooter as AppCardFooter,
  CardHeader as AppCardHeader,
  CardTitle as AppCardTitle,
};
