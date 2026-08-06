import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type {
  CreateBookingRecord,
  ListStaffBookingsQuery,
  SalonBookingsRepository,
} from "./types";
import type { BookingStatus, SalonBooking, UpdateBookingInput } from "../types";

type AnySupabase = SupabaseClient<Database>;

type BookingRow = {
  id: string;
  salon_id: string;
  staff_id: string;
  customer_id: string | null;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  buffer_minutes: number;
  status: string;
  notes: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: BookingRow): SalonBooking {
  return {
    id: row.id,
    salonId: row.salon_id,
    staffId: row.staff_id,
    customerId: row.customer_id,
    serviceId: row.service_id,
    bookingDate: row.booking_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    duration: row.duration,
    bufferMinutes: row.buffer_minutes,
    status: row.status as BookingStatus,
    notes: row.notes,
    customerName: row.customer_name ?? "",
    customerEmail: row.customer_email ?? "",
    customerPhone: row.customer_phone ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Supabase-backed repository for marketplace salon bookings.
 * Scales to thousands of salons via indexed staff/date queries.
 */
export function createSupabaseSalonBookingsRepository(
  supabase: AnySupabase,
): SalonBookingsRepository {
  return {
    async getById(id) {
      const { data, error } = await supabase
        .from("salon_bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapRow(data as BookingRow) : null;
    },

    async listStaffBookingsForDate(query: ListStaffBookingsQuery) {
      const { data, error } = await supabase
        .from("salon_bookings")
        .select("*")
        .eq("salon_id", query.salonId)
        .eq("staff_id", query.staffId)
        .eq("booking_date", query.bookingDate);
      if (error) throw new Error(error.message);
      return (data as BookingRow[] | null)?.map(mapRow) ?? [];
    },

    async create(input: CreateBookingRecord) {
      let customerId = input.customerId;
      if (!customerId && input.customerName) {
        const { data: customer, error: customerError } = await supabase
          .from("salon_customers")
          .insert({
            salon_id: input.salonId,
            full_name: input.customerName,
            email: input.customerEmail || null,
            phone: input.customerPhone || null,
          })
          .select("id")
          .single();
        if (customerError) throw new Error(customerError.message);
        customerId = customer.id;
      }

      const { data, error } = await supabase
        .from("salon_bookings")
        .insert({
          salon_id: input.salonId,
          staff_id: input.staffId,
          customer_id: customerId,
          service_id: input.serviceId,
          booking_date: input.bookingDate,
          start_time: input.startTime,
          end_time: input.endTime,
          duration: input.duration,
          buffer_minutes: input.bufferMinutes,
          status: input.status,
          notes: input.notes,
          customer_name: input.customerName,
          customer_email: input.customerEmail || null,
          customer_phone: input.customerPhone || null,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data as BookingRow);
    },

    async update(id: string, patch: UpdateBookingInput) {
      const payload: Database["public"]["Tables"]["salon_bookings"]["Update"] = {
        updated_at: new Date().toISOString(),
      };
      if (patch.bookingDate !== undefined) payload.booking_date = patch.bookingDate;
      if (patch.startTime !== undefined) payload.start_time = patch.startTime;
      if (patch.endTime !== undefined) payload.end_time = patch.endTime;
      if (patch.duration !== undefined) payload.duration = patch.duration;
      if (patch.bufferMinutes !== undefined) {
        payload.buffer_minutes = patch.bufferMinutes;
      }
      if (patch.staffId !== undefined) payload.staff_id = patch.staffId;
      if (patch.serviceId !== undefined) payload.service_id = patch.serviceId;
      if (patch.status !== undefined) payload.status = patch.status;
      if (patch.notes !== undefined) payload.notes = patch.notes;
      if (patch.customerName !== undefined) {
        payload.customer_name = patch.customerName;
      }
      if (patch.customerEmail !== undefined) {
        payload.customer_email = patch.customerEmail;
      }
      if (patch.customerPhone !== undefined) {
        payload.customer_phone = patch.customerPhone;
      }

      const { data, error } = await supabase
        .from("salon_bookings")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return mapRow(data as BookingRow);
    },
  };
}
