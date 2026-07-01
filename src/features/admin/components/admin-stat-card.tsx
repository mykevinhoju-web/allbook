import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: AdminStatCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
