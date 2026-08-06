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
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_owner_profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string;
          full_name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_memberships: {
        Row: {
          id: string;
          tenant_id: string;
          auth_user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          auth_user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          auth_user_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
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
          room_id: string | null;
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
          room_id?: string | null;
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
          room_id?: string | null;
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
          pin: string | null;
          last_seen_at: string | null;
          session_started_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          staff_id: string;
          login_id: string;
          password_hash: string;
          pin?: string | null;
          last_seen_at?: string | null;
          session_started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          staff_id?: string;
          login_id?: string;
          password_hash?: string;
          pin?: string | null;
          last_seen_at?: string | null;
          session_started_at?: string | null;
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
          claimed_device_id: string | null;
          claimed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          claimed_device_id?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          claimed_device_id?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_staffs: {
        Row: {
          id: string;
          tenant_id: string;
          booking_id: string;
          staff_id: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          booking_id: string;
          staff_id: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          booking_id?: string;
          staff_id?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      booking_extend_requests: {
        Row: {
          id: string;
          tenant_id: string;
          booking_id: string;
          requested_by_staff_id: string;
          minutes: number;
          status: string;
          payment_method: string | null;
          price_cents: number | null;
          created_at: string;
          resolved_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          booking_id: string;
          requested_by_staff_id: string;
          minutes: number;
          status?: string;
          payment_method?: string | null;
          price_cents?: number | null;
          created_at?: string;
          resolved_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          booking_id?: string;
          requested_by_staff_id?: string;
          minutes?: number;
          status?: string;
          payment_method?: string | null;
          price_cents?: number | null;
          created_at?: string;
          resolved_at?: string | null;
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
          checked_out_at: string | null;
          checked_in_at: string | null;
          payment_status: string;
          paid_at: string | null;
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
          checked_out_at?: string | null;
          checked_in_at?: string | null;
          payment_status?: string;
          paid_at?: string | null;
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
          checked_out_at?: string | null;
          checked_in_at?: string | null;
          payment_status?: string;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          booking_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          paid_at: string | null;
          failure_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          booking_id: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          paid_at?: string | null;
          failure_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          booking_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          paid_at?: string | null;
          failure_message?: string | null;
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
      salons: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          cover_image: string | null;
          logo: string | null;
          address: string | null;
          suburb: string | null;
          city: string;
          state: string;
          postcode: string | null;
          country: string;
          latitude: number;
          longitude: number;
          rating: number;
          review_count: number;
          verified: boolean;
          primary_service: string | null;
          starting_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          cover_image?: string | null;
          logo?: string | null;
          address?: string | null;
          suburb?: string | null;
          city?: string;
          state?: string;
          postcode?: string | null;
          country?: string;
          latitude: number;
          longitude: number;
          rating?: number;
          review_count?: number;
          verified?: boolean;
          primary_service?: string | null;
          starting_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          cover_image?: string | null;
          logo?: string | null;
          address?: string | null;
          suburb?: string | null;
          city?: string;
          state?: string;
          postcode?: string | null;
          country?: string;
          latitude?: number;
          longitude?: number;
          rating?: number;
          review_count?: number;
          verified?: boolean;
          primary_service?: string | null;
          starting_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          salon_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          salon_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          salon_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          salon_id: string;
          user_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          user_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          user_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_marketplace_salons: {
        Args: {
          p_lat?: number | null;
          p_lng?: number | null;
          p_radius_km?: number | null;
          p_service?: string | null;
          p_services?: string[] | null;
          p_suburb?: string | null;
          p_sort?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: Array<{
          id: string;
          name: string;
          description: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          cover_image: string | null;
          logo: string | null;
          address: string | null;
          suburb: string | null;
          city: string;
          state: string;
          postcode: string | null;
          country: string;
          latitude: number;
          longitude: number;
          rating: number;
          review_count: number;
          verified: boolean;
          primary_service: string | null;
          starting_price: number;
          created_at: string;
          updated_at: string;
          distance_km: number | null;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
