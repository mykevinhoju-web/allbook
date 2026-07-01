export type AuthRole = "customer" | "shop_owner" | "staff" | "admin";

export interface AuthUserProfile {
  id: string;
  email: string;
  role: AuthRole;
}
