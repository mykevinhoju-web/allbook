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
      push_subscriptions: {
        Row: {
          id: string;
          tenant_slug: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          audience: string;
          staff_id: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_slug: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          audience?: string;
          staff_id?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_slug?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          audience?: string;
          staff_id?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      staff_accounts: {
        Row: {
          id: string;
          tenant_id: string;
          staff_id: string;
          login_id: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          staff_id: string;
          login_id: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          staff_id?: string;
          login_id?: string;
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_accounts: {
        Row: {
          id: string;
          tenant_id: string;
          login_id: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          login_id: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          login_id?: string;
          password_hash?: string;
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
      staff: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          status: string;
          attributes: Json;
          working_days: string[];
          working_hours_start: string;
          working_hours_end: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          status?: string;
          attributes?: Json;
          working_days?: string[];
          working_hours_start?: string;
          working_hours_end?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          status?: string;
          attributes?: Json;
          working_days?: string[];
          working_hours_start?: string;
          working_hours_end?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_photos: {
        Row: {
          id: string;
          tenant_id: string;
          staff_id: string;
          url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          staff_id: string;
          url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          staff_id?: string;
          url?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          tenant_id: string;
          staff_id: string;
          room_id: string | null;
          starts_at: string;
          ends_at: string;
          duration_minutes: number;
          price_cents: number;
          status: string;
          customer_name: string | null;
          customer_phone: string | null;
          customer_postcode: string | null;
          customer_email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          staff_id: string;
          room_id?: string | null;
          starts_at: string;
          ends_at: string;
          duration_minutes: number;
          price_cents?: number;
          status?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_postcode?: string | null;
          customer_email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          staff_id?: string;
          room_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          duration_minutes?: number;
          price_cents?: number;
          status?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_postcode?: string | null;
          customer_email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_options: {
        Row: {
          id: string;
          tenant_id: string;
          duration_minutes: number;
          price_cents: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          duration_minutes: number;
          price_cents: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          duration_minutes?: number;
          price_cents?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
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
