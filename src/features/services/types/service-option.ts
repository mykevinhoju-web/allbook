export interface ServiceOption {
  id: string;
  durationMinutes: number;
  priceCents: number;
  staffPayoutCents: number;
  /** Extra customer amount when the booking is an out call. */
  outcallPriceCents: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceOptionInput {
  durationMinutes: number;
  price: number;
  staffPayout?: number;
  outcallPrice?: number;
}
