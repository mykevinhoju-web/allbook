export interface ServiceOption {
  id: string;
  durationMinutes: number;
  priceCents: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceOptionInput {
  durationMinutes: number;
  price: number;
}
