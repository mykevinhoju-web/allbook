import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StaffFormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function StaffFormField({
  label,
  htmlFor,
  required = false,
  hint,
  className,
  children,
}: StaffFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
