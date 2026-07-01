"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { AppButton } from "./app-button";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <AppButton
            variant="outline"
            className={cn(
              "w-full justify-start rounded-xl font-normal shadow-soft",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {value ? format(value, "PPP") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-xl p-0 shadow-soft-lg" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          disabled={(date) => {
            if (fromDate && date < fromDate) return true;
            if (toDate && date > toDate) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
