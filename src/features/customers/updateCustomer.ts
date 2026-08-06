import { customerFullName } from "./constants";
import type {
  CustomerInput,
  CustomerNote,
  CustomerTag,
  SalonCustomer,
} from "./types";

export function validateCustomerInput(
  input: Partial<CustomerInput>,
): string | null {
  if (!input.firstName?.trim()) return "First name is required.";
  if (!input.lastName?.trim()) return "Last name is required.";
  return null;
}

export async function createCustomer(
  salonId: string,
  input: CustomerInput,
): Promise<SalonCustomer> {
  const error = validateCustomerInput(input);
  if (error) throw new Error(error);

  const id = `cust_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const fullName = customerFullName(input.firstName, input.lastName);

  return {
    id,
    salonId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName,
    phone: input.phone?.trim() ?? "",
    email: input.email?.trim() ?? "",
    birthday: input.birthday ?? null,
    gender: input.gender ?? null,
    avatar: input.avatar ?? null,
    status: input.status ?? "regular",
    joinedAt: now,
    updatedAt: now,
    tags: input.tags ?? [],
    loyaltyPoints: 0,
    statistics: {
      totalBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalSpent: 0,
      averageSpent: 0,
      lastVisit: null,
      nextBooking: null,
      preferredStaffId: null,
      preferredStaffName: null,
      favoriteServiceId: null,
      favoriteServiceName: null,
    },
    notes: [],
    timeline: [
      {
        id: `tl_${crypto.randomUUID().slice(0, 8)}`,
        customerId: id,
        eventType: "status_changed",
        title: "Customer created",
        detail: fullName,
        bookingId: null,
        createdAt: now,
      },
    ],
    media: [],
    bookingHistory: [],
    upcomingBookings: [],
    cancelledBookings: [],
    favouriteServices: [],
  };
}

export async function updateCustomer(
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

  return {
    ...customer,
    firstName: next.firstName.trim(),
    lastName: next.lastName.trim(),
    fullName: customerFullName(next.firstName, next.lastName),
    phone: next.phone?.trim() ?? "",
    email: next.email?.trim() ?? "",
    birthday: next.birthday ?? null,
    gender: next.gender ?? null,
    avatar: next.avatar ?? null,
    status: next.status ?? customer.status,
    tags: next.tags ?? customer.tags,
    updatedAt: new Date().toISOString(),
  };
}

export async function blockCustomer(
  customer: SalonCustomer,
): Promise<SalonCustomer> {
  return updateCustomer(customer, { status: "blocked" });
}

export async function addCustomerNote(
  customer: SalonCustomer,
  note: string,
  staff?: { id: string; name: string } | null,
): Promise<SalonCustomer> {
  if (!note.trim()) throw new Error("Note cannot be empty.");
  const entry: CustomerNote = {
    id: `note_${crypto.randomUUID().slice(0, 8)}`,
    customerId: customer.id,
    staffId: staff?.id ?? null,
    staffName: staff?.name ?? null,
    note: note.trim(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...customer,
    notes: [entry, ...customer.notes],
    timeline: [
      {
        id: `tl_${crypto.randomUUID().slice(0, 8)}`,
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
  customer: SalonCustomer,
  tags: CustomerTag[],
): Promise<SalonCustomer> {
  return {
    ...customer,
    tags,
    updatedAt: new Date().toISOString(),
  };
}
