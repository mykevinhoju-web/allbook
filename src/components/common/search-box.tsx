"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { AppButton } from "./app-button";

interface SearchBoxProps extends Omit<React.ComponentProps<"input">, "size"> {
  value?: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
  showClearButton?: boolean;
}

export function SearchBox({
  value,
  onValueChange,
  onClear,
  placeholder = "Search...",
  className,
  containerClassName,
  showClearButton = true,
  ...props
}: SearchBoxProps) {
  const hasValue = Boolean(value && value.length > 0);

  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 rounded-xl border-border/60 bg-background pl-9 shadow-soft",
          hasValue && showClearButton ? "pr-9" : "pr-3",
          className,
        )}
        {...props}
      />
      {hasValue && showClearButton ? (
        <AppButton
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
          onClick={() => {
            onValueChange?.("");
            onClear?.();
          }}
          aria-label="Clear search"
        >
          <X className="size-4" />
        </AppButton>
      ) : null}
    </div>
  );
}
