"use client";

import { Clock } from "lucide-react";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { AppButton } from "./app-button";

const DEFAULT_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  timeSlots?: string[];
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  timeSlots = DEFAULT_TIME_SLOTS,
}: TimePickerProps) {
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
        <Clock className="size-4" />
        {value ?? placeholder}
      </PopoverTrigger>
      <PopoverContent
        className="w-48 rounded-xl p-0 shadow-soft-lg"
        align="start"
      >
        <ScrollArea className="h-64">
          <div className="grid gap-1 p-2">
            {timeSlots.map((slot) => (
              <AppButton
                key={slot}
                variant={value === slot ? "primary" : "ghost"}
                size="sm"
                className="w-full justify-start rounded-lg"
                onClick={() => {
                  onChange?.(slot);
                  setOpen(false);
                }}
              >
                {slot}
              </AppButton>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
