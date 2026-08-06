"use client";

import { useState } from "react";
import { DoorOpen } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";

type BookingFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

interface BookingCheckoutButtonProps {
  bookingId: string;
  roomName?: string | null;
  onCheckedOut?: () => void;
  size?: "sm" | "default";
  className?: string;
  fetchApi?: BookingFetch;
}

export function BookingCheckoutButton({
  bookingId,
  roomName,
  onCheckedOut,
  size = "sm",
  className,
  fetchApi = fetchAdminApi,
}: BookingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setLoading(true);

    try {
      const response = await fetchApi(`/api/admin/bookings/${bookingId}/checkout`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        roomVacated?: boolean;
      };

      if (!response.ok) {
        toast.error("Could not check out", { description: data.error });
        return;
      }

      toast.success("Checked out", {
        description: roomName
          ? `${roomName} is now available.`
          : "Room is now available.",
      });
      onCheckedOut?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppButton
      type="button"
      size={size}
      variant="outline"
      className={className}
      disabled={loading}
      onClick={() => void checkout()}
    >
      <DoorOpen className="size-4" />
      {loading ? "Checking out…" : "Check out"}
    </AppButton>
  );
}
