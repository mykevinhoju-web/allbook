/**
 * Browser-side customer mutations (owner-authenticated APIs).
 */
import type {
  CustomerInput,
  CustomerTag,
  SalonCustomer,
} from "./types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

export async function createCustomer(
  salonId: string,
  input: CustomerInput,
): Promise<SalonCustomer> {
  const response = await fetch("/api/platform/salon/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salonId, input }),
  });
  const data = await parseJson<{ customer: SalonCustomer }>(response);
  return data.customer;
}

export async function updateCustomer(
  customer: SalonCustomer,
  patch: Partial<CustomerInput>,
): Promise<SalonCustomer> {
  const response = await fetch(
    `/api/platform/salon/customers/${customer.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId: customer.salonId, patch }),
    },
  );
  const data = await parseJson<{ customer: SalonCustomer }>(response);
  return data.customer;
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
  const response = await fetch(
    `/api/platform/salon/customers/${customer.id}/notes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salonId: customer.salonId,
        note,
        staff: staff ?? null,
      }),
    },
  );
  const data = await parseJson<{ customer: SalonCustomer }>(response);
  return data.customer;
}

export async function setCustomerTags(
  customer: SalonCustomer,
  tags: CustomerTag[],
): Promise<SalonCustomer> {
  const response = await fetch(
    `/api/platform/salon/customers/${customer.id}/tags`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId: customer.salonId, tags }),
    },
  );
  const data = await parseJson<{ customer: SalonCustomer }>(response);
  return data.customer;
}
