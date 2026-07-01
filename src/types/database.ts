/**
 * Supabase database types.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          display_name: string;
          tagline: string | null;
          logo_url: string | null;
          primary_domain: string | null;
          timezone: string;
          currency: string;
          locale: string;
          is_active: boolean;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          display_name: string;
          tagline?: string | null;
          logo_url?: string | null;
          primary_domain?: string | null;
          timezone?: string;
          currency?: string;
          locale?: string;
          is_active?: boolean;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          display_name?: string;
          tagline?: string | null;
          logo_url?: string | null;
          primary_domain?: string | null;
          timezone?: string;
          currency?: string;
          locale?: string;
          is_active?: boolean;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_alert_events: {
        Row: {
          id: string;
          tenant_slug: string;
          staff_id: string;
          staff_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_slug: string;
          staff_id: string;
          staff_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_slug?: string;
          staff_id?: string;
          staff_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
