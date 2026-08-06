import { MOCK_CUSTOMERS } from "./mock-data";
import type { CustomerListQuery, SalonCustomer } from "./types";

export async function getCustomers(
  query: CustomerListQuery,
): Promise<SalonCustomer[]> {
  let rows = MOCK_CUSTOMERS.filter((c) => c.salonId === query.salonId);

  if (query.status && query.status !== "all") {
    rows = rows.filter((c) => c.status === query.status);
  }
  if (query.tag && query.tag !== "all") {
    const tag = query.tag;
    rows = rows.filter((c) => c.tags.includes(tag));
  }
  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    );
  }

  const sort = query.sort ?? "name";
  const dir = query.sortDir === "desc" ? -1 : 1;

  rows = [...rows].sort((a, b) => {
    if (sort === "last_visit") {
      return (
        dir *
        ((a.statistics.lastVisit ?? "").localeCompare(
          b.statistics.lastVisit ?? "",
        ))
      );
    }
    if (sort === "total_spent") {
      return dir * (a.statistics.totalSpent - b.statistics.totalSpent);
    }
    if (sort === "joined") {
      return dir * a.joinedAt.localeCompare(b.joinedAt);
    }
    return dir * a.fullName.localeCompare(b.fullName);
  });

  return rows;
}

export async function getCustomer(
  salonId: string,
  customerId: string,
): Promise<SalonCustomer | null> {
  return (
    MOCK_CUSTOMERS.find(
      (c) => c.salonId === salonId && c.id === customerId,
    ) ?? null
  );
}
