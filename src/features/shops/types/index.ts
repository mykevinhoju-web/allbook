import type { BusinessCategory } from "@/types";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  category: BusinessCategory;
  description: string | null;
  isActive: boolean;
}
