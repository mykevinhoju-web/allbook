import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { customerFullName } from "./constants";
import { getCustomer } from "./getCustomers";
import { mapCustomerRow, type CustomerRow } from "./map-customer";
import type {
  CustomerInput,
  CustomerNote,
  CustomerTag,
  SalonCustomer,
} from "./types";
import { validateCustomerInput } from "./validateCustomer";

type AnySupabase = SupabaseClient<Database>;

export { validateCustomerInput } from "./validateCustomer";

async function replaceTags(
  supabase: AnySupabase,
  customerId: string,
  tags: CustomerTag[],
) {
  const { error: delError } = await supabase
    .from("salon_customer_tags")
    .delete()
    .eq("customer_id", customerId);
  if (delError) throw new Error(delError.message);
  if (tags.length === 0) return;
  const { error } = await supabase.from("salon_customer_tags").insert(
    tags.map((tag) => ({ customer_id: customerId, tag })),
  );
  if (error) throw new Error(error.message);
}

export async function createCustomer(
  supabase: AnySupabase,
  salonId: string,
  input: CustomerInput,
): Promise<SalonCustomer> {
  const error = validateCustomerInput(input);
  if (error) throw new Error(error);

  const fullName = customerFullName(input.firstName, input.lastName);
  const tags = input.tags ?? [];

  const { data, error: insertError } = await supabase
    .from("salon_customers")
    .insert({
      salon_id: salonId,
      full_name: fullName,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      birthday: input.birthday ?? null,
      gender: input.gender ?? null,
      avatar: input.avatar ?? null,
      status: input.status ?? "regular",
      loyalty_points: 0,
    })
    .select("*")
    .single();

  if (insertError || !data) {
    throw new Error(insertError?.message ?? "Could not create customer.");
  }

  await replaceTags(supabase, data.id, tags);

  await supabase.from("salon_customer_timeline").insert({
    customer_id: data.id,
    salon_id: salonId,
    event_type: "status_changed",
    title: "Customer created",
    detail: fullName,
  });

  const loaded = await getCustomer(supabase, salonId, data.id);
  if (loaded) return loaded;

  return mapCustomerRow(data as CustomerRow, { tags });
}

export async function updateCustomer(
  supabase: AnySupabase,
  customer: SalonCustomer,
  patch: Partial<CustomerInput>,
): Promise<SalonCustomer> {
  const next: CustomerInput = {
    firstName: patch.firstName ?? customer.firstName,
    lastName: patch.lastName ?? customer.lastName,
    phone: patch.phone ?? customer.phone,
    email: patch.email ?? customer.email,
    birthday: patch.birthday !== undefined ? patch.birthday : customer.birthday,
    gender: patch.gender !== undefined ? patch.gender : customer.gender,
    avatar: patch.avatar !== undefined ? patch.avatar : customer.avatar,
    status: patch.status ?? customer.status,
    tags: patch.tags ?? customer.tags,
  };

  const error = validateCustomerInput(next);
  if (error) throw new Error(error);

  const fullName = customerFullName(next.firstName, next.lastName);
  const statusChanged = next.status !== customer.status;

  const { data, error: updateError } = await supabase
    .from("salon_customers")
    .update({
      full_name: fullName,
      first_name: next.firstName.trim(),
      last_name: next.lastName.trim(),
      email: next.email?.trim() || null,
      phone: next.phone?.trim() || null,
      birthday: next.birthday ?? null,
      gender: next.gender ?? null,
      avatar: next.avatar ?? null,
      status: next.status ?? customer.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customer.id)
    .eq("salon_id", customer.salonId)
    .select("*")
    .single();

  if (updateError || !data) {
    throw new Error(updateError?.message ?? "Could not update customer.");
  }

  if (patch.tags) {
    await replaceTags(supabase, customer.id, next.tags ?? []);
  }

  if (statusChanged) {
    await supabase.from("salon_customer_timeline").insert({
      customer_id: customer.id,
      salon_id: customer.salonId,
      event_type: "status_changed",
      title: "Status changed",
      detail: `${customer.status} → ${next.status}`,
    });
  }

  const loaded = await getCustomer(supabase, customer.salonId, customer.id);
  if (loaded) return loaded;
  return mapCustomerRow(data as CustomerRow, {
    tags: next.tags ?? customer.tags,
    statistics: customer.statistics,
    notes: customer.notes,
    timeline: customer.timeline,
    media: customer.media,
    bookingHistory: customer.bookingHistory,
    upcomingBookings: customer.upcomingBookings,
    cancelledBookings: customer.cancelledBookings,
    favouriteServices: customer.favouriteServices,
  });
}

export async function blockCustomer(
  supabase: AnySupabase,
  customer: SalonCustomer,
): Promise<SalonCustomer> {
  return updateCustomer(supabase, customer, { status: "blocked" });
}

export async function addCustomerNote(
  supabase: AnySupabase,
  customer: SalonCustomer,
  note: string,
  staff?: { id: string; name: string } | null,
): Promise<SalonCustomer> {
  if (!note.trim()) throw new Error("Note cannot be empty.");

  const { data, error } = await supabase
    .from("salon_customer_notes")
    .insert({
      customer_id: customer.id,
      staff_id: staff?.id ?? null,
      note: note.trim(),
    })
    .select("id, customer_id, staff_id, note, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not add note.");
  }

  await supabase.from("salon_customer_timeline").insert({
    customer_id: customer.id,
    salon_id: customer.salonId,
    event_type: "note_added",
    title: "Note added",
    detail: data.note,
  });

  const entry: CustomerNote = {
    id: data.id,
    customerId: data.customer_id,
    staffId: data.staff_id,
    staffName: staff?.name ?? null,
    note: data.note,
    createdAt: data.created_at,
  };

  return {
    ...customer,
    notes: [entry, ...customer.notes],
    timeline: [
      {
        id: crypto.randomUUID(),
        customerId: customer.id,
        eventType: "note_added",
        title: "Note added",
        detail: entry.note,
        bookingId: null,
        createdAt: entry.createdAt,
      },
      ...customer.timeline,
    ],
    updatedAt: new Date().toISOString(),
  };
}

export async function setCustomerTags(
  supabase: AnySupabase,
  customer: SalonCustomer,
  tags: CustomerTag[],
): Promise<SalonCustomer> {
  await replaceTags(supabase, customer.id, tags);
  const { error } = await supabase
    .from("salon_customers")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", customer.id)
    .eq("salon_id", customer.salonId);
  if (error) throw new Error(error.message);

  return {
    ...customer,
    tags,
    updatedAt: new Date().toISOString(),
  };
}
