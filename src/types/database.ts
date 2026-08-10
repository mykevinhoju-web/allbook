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
        Relationships: [
          {
            foreignKeyName: "booking_staffs_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_staffs_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "bookings_staff_id_fkey",
            columns: ["staff_id"],
            isOneToOne: false,
            referencedRelation: "staff",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "bookings_room_id_fkey",
            columns: ["room_id"],
            isOneToOne: false,
            referencedRelation: "rooms",
            referencedColumns: ["id"],
          },
        ];
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
      search_area_coverage: {
        Row: {
          id: string;
          area_key: string;
          category_slug: string;
          location_label: string | null;
          latitude: number;
          longitude: number;
          radius_km: number;
          last_fetched_at: string | null;
          last_status: string;
          imported_count: number;
          updated_count: number;
          skipped_count: number;
          failed_count: number;
          error_message: string | null;
          resume_page_token: string | null;
          pages_fetched: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          area_key: string;
          category_slug: string;
          location_label?: string | null;
          latitude: number;
          longitude: number;
          radius_km?: number;
          last_fetched_at?: string | null;
          last_status?: string;
          imported_count?: number;
          updated_count?: number;
          skipped_count?: number;
          failed_count?: number;
          error_message?: string | null;
          resume_page_token?: string | null;
          pages_fetched?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          area_key?: string;
          category_slug?: string;
          location_label?: string | null;
          latitude?: number;
          longitude?: number;
          radius_km?: number;
          last_fetched_at?: string | null;
          last_status?: string;
          imported_count?: number;
          updated_count?: number;
          skipped_count?: number;
          failed_count?: number;
          error_message?: string | null;
          resume_page_token?: string | null;
          pages_fetched?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      search_google_import_runs: {
        Row: {
          id: string;
          area_key: string;
          category_slug: string;
          location_label: string | null;
          latitude: number | null;
          longitude: number | null;
          radius_km: number | null;
          queried: number;
          imported: number;
          updated: number;
          skipped: number;
          failed: number;
          status: string;
          error_message: string | null;
          pages_fetched: number;
          remaining_pages: number;
          resume_page_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          area_key: string;
          category_slug: string;
          location_label?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          radius_km?: number | null;
          queried?: number;
          imported?: number;
          updated?: number;
          skipped?: number;
          failed?: number;
          status?: string;
          error_message?: string | null;
          pages_fetched?: number;
          remaining_pages?: number;
          resume_page_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          area_key?: string;
          category_slug?: string;
          location_label?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          radius_km?: number | null;
          queried?: number;
          imported?: number;
          updated?: number;
          skipped?: number;
          failed?: number;
          status?: string;
          error_message?: string | null;
          pages_fetched?: number;
          remaining_pages?: number;
          resume_page_token?: string | null;
          created_at?: string;
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
          slug: string;
          category_id: string | null;
          suburb_id: string | null;
          price_min: number | null;
          price_max: number | null;
          amenities: string[];
          service_tags: string[];
          service_tags_synced_at: string | null;
          services_enriched_at: string | null;
          opening_hours: Record<string, unknown>;
          registration_method: "google" | "manual" | "admin" | null;
          google_place_id: string | null;
          social_instagram: string | null;
          social_facebook: string | null;
          social_tiktok: string | null;
          languages: string[];
          booking_enabled: boolean;
          accept_new_customers: boolean;
          source: "google" | "manual" | "admin" | "owner";
          claimed: boolean;
          google_categories: string[];
          google_synced_at: string | null;
          google_photos: unknown;
          owner_name_override: boolean;
          google_business_status: string | null;
          google_snapshot_hash: string | null;
          permanently_closed: boolean;
          review_status: "pending" | "approved" | "rejected" | "duplicate" | "hidden";
          marketplace_visible: boolean;
          duplicate_of_salon_id: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          imported_at: string | null;
          search_keywords: string[];
          owner_keywords: string[];
          owner_keyword_limit: number;
          ownership_status: string;
          search_styles: string[];
          search_brands: string[];
          search_techniques: string[];
          search_features: string[];
          price_tier: string | null;
          is_synthetic: boolean;
          search_availability_mode: string;
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
          slug: string;
          category_id?: string | null;
          suburb_id?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          amenities?: string[];
          service_tags?: string[];
          service_tags_synced_at?: string | null;
          services_enriched_at?: string | null;
          opening_hours?: Record<string, unknown>;
          registration_method?: "google" | "manual" | "admin" | null;
          google_place_id?: string | null;
          social_instagram?: string | null;
          social_facebook?: string | null;
          social_tiktok?: string | null;
          languages?: string[];
          booking_enabled?: boolean;
          accept_new_customers?: boolean;
          source?: "google" | "manual" | "admin" | "owner";
          claimed?: boolean;
          google_categories?: string[];
          google_synced_at?: string | null;
          google_photos?: unknown;
          owner_name_override?: boolean;
          google_business_status?: string | null;
          google_snapshot_hash?: string | null;
          permanently_closed?: boolean;
          review_status?: "pending" | "approved" | "rejected" | "duplicate" | "hidden";
          marketplace_visible?: boolean;
          duplicate_of_salon_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          imported_at?: string | null;
          search_keywords?: string[];
          owner_keywords?: string[];
          owner_keyword_limit?: number;
          ownership_status?: string;
          search_styles?: string[];
          search_brands?: string[];
          search_techniques?: string[];
          search_features?: string[];
          price_tier?: string | null;
          is_synthetic?: boolean;
          search_availability_mode?: string;
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
          slug?: string;
          category_id?: string | null;
          suburb_id?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          amenities?: string[];
          service_tags?: string[];
          service_tags_synced_at?: string | null;
          services_enriched_at?: string | null;
          opening_hours?: Record<string, unknown>;
          registration_method?: "google" | "manual" | "admin" | null;
          google_place_id?: string | null;
          social_instagram?: string | null;
          social_facebook?: string | null;
          social_tiktok?: string | null;
          languages?: string[];
          booking_enabled?: boolean;
          accept_new_customers?: boolean;
          source?: "google" | "manual" | "admin" | "owner";
          claimed?: boolean;
          google_categories?: string[];
          google_synced_at?: string | null;
          google_photos?: unknown;
          owner_name_override?: boolean;
          google_business_status?: string | null;
          google_snapshot_hash?: string | null;
          permanently_closed?: boolean;
          review_status?: "pending" | "approved" | "rejected" | "duplicate" | "hidden";
          marketplace_visible?: boolean;
          duplicate_of_salon_id?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          imported_at?: string | null;
          search_keywords?: string[];
          owner_keywords?: string[];
          owner_keyword_limit?: number;
          ownership_status?: string;
          search_styles?: string[];
          search_brands?: string[];
          search_techniques?: string[];
          search_features?: string[];
          price_tier?: string | null;
          is_synthetic?: boolean;
          search_availability_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salons_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "business_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salons_suburb_id_fkey";
            columns: ["suburb_id"];
            isOneToOne: false;
            referencedRelation: "suburbs";
            referencedColumns: ["id"];
          },
        ];
      };
      google_sync_runs: {
        Row: {
          id: string;
          scope: "single" | "city" | "state" | "scheduled";
          country: string | null;
          state: string | null;
          city: string | null;
          salon_id: string | null;
          status: "queued" | "running" | "completed" | "failed";
          triggered_by: string | null;
          totals: Json;
          error: string | null;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          scope: "single" | "city" | "state" | "scheduled";
          country?: string | null;
          state?: string | null;
          city?: string | null;
          salon_id?: string | null;
          status?: "queued" | "running" | "completed" | "failed";
          triggered_by?: string | null;
          totals?: Json;
          error?: string | null;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          scope?: "single" | "city" | "state" | "scheduled";
          country?: string | null;
          state?: string | null;
          city?: string | null;
          salon_id?: string | null;
          status?: "queued" | "running" | "completed" | "failed";
          triggered_by?: string | null;
          totals?: Json;
          error?: string | null;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "google_sync_runs_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      google_sync_run_items: {
        Row: {
          id: string;
          run_id: string;
          salon_id: string | null;
          place_id: string | null;
          business_name: string | null;
          result: "updated" | "unchanged" | "failed" | "closed" | "missing";
          changed_fields: string[];
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          salon_id?: string | null;
          place_id?: string | null;
          business_name?: string | null;
          result: "updated" | "unchanged" | "failed" | "closed" | "missing";
          changed_fields?: string[];
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          salon_id?: string | null;
          place_id?: string | null;
          business_name?: string | null;
          result?: "updated" | "unchanged" | "failed" | "closed" | "missing";
          changed_fields?: string[];
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "google_sync_run_items_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "google_sync_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "google_sync_run_items_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_business_events: {
        Row: {
          id: string;
          salon_id: string | null;
          related_salon_id: string | null;
          place_id: string | null;
          action:
            | "imported"
            | "updated"
            | "merged"
            | "rejected"
            | "hidden"
            | "claimed"
            | "synced"
            | "approved"
            | "restored"
            | "marked_duplicate"
            | "permanently_closed"
            | "re_synced"
            | "import_error";
          actor: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id?: string | null;
          related_salon_id?: string | null;
          place_id?: string | null;
          action:
            | "imported"
            | "updated"
            | "merged"
            | "rejected"
            | "hidden"
            | "claimed"
            | "synced"
            | "approved"
            | "restored"
            | "marked_duplicate"
            | "permanently_closed"
            | "re_synced"
            | "import_error";
          actor?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string | null;
          related_salon_id?: string | null;
          place_id?: string | null;
          action?:
            | "imported"
            | "updated"
            | "merged"
            | "rejected"
            | "hidden"
            | "claimed"
            | "synced"
            | "approved"
            | "restored"
            | "marked_duplicate"
            | "permanently_closed"
            | "re_synced"
            | "import_error";
          actor?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_business_events_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketplace_business_events_related_salon_id_fkey";
            columns: ["related_salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_owners: {
        Row: {
          id: string;
          salon_id: string;
          full_name: string;
          email: string;
          password_hash: string;
          auth_user_id: string | null;
          role: "owner" | "admin" | "staff";
          accepted_terms_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          full_name: string;
          email: string;
          password_hash: string;
          auth_user_id?: string | null;
          role?: "owner" | "admin" | "staff";
          accepted_terms_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          full_name?: string;
          email?: string;
          password_hash?: string;
          auth_user_id?: string | null;
          role?: "owner" | "admin" | "staff";
          accepted_terms_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_owners_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: true;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      business_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      suburbs: {
        Row: {
          id: string;
          name: string;
          postcode: string | null;
          city: string;
          state: string;
          country: string;
          latitude: number;
          longitude: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          postcode?: string | null;
          city?: string;
          state?: string;
          country?: string;
          latitude: number;
          longitude: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          postcode?: string | null;
          city?: string;
          state?: string;
          country?: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      salon_images: {
        Row: {
          id: string;
          salon_id: string;
          url: string;
          alt: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          url: string;
          alt?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          url?: string;
          alt?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_images_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_services: {
        Row: {
          id: string;
          salon_id: string;
          category: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          price_type: "fixed" | "from" | "range";
          price_max: number | null;
          booking_enabled: boolean;
          featured: boolean;
          status: "active" | "inactive" | "archived";
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          category: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price: number;
          price_type?: "fixed" | "from" | "range";
          price_max?: number | null;
          booking_enabled?: boolean;
          featured?: boolean;
          status?: "active" | "inactive" | "archived";
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          category?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          price_type?: "fixed" | "from" | "range";
          price_max?: number | null;
          booking_enabled?: boolean;
          featured?: boolean;
          status?: "active" | "inactive" | "archived";
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_services_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_settings: {
        Row: {
          group_key: string;
          setting_key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          group_key: string;
          setting_key: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          group_key?: string;
          setting_key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      salon_settings: {
        Row: {
          id: string;
          salon_id: string;
          group_key: string;
          setting_key: string;
          value: Json;
          level: "business" | "service" | "staff" | "booking";
          scope_id: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          group_key: string;
          setting_key: string;
          value?: Json;
          level?: "business" | "service" | "staff" | "booking";
          scope_id?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          group_key?: string;
          setting_key?: string;
          value?: Json;
          level?: "business" | "service" | "staff" | "booking";
          scope_id?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_settings_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_feature_flags: {
        Row: {
          salon_id: string;
          flag_key: string;
          enabled: boolean;
          config: Json;
          updated_at: string;
        };
        Insert: {
          salon_id: string;
          flag_key: string;
          enabled?: boolean;
          config?: Json;
          updated_at?: string;
        };
        Update: {
          salon_id?: string;
          flag_key?: string;
          enabled?: boolean;
          config?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_feature_flags_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_integration_slots: {
        Row: {
          salon_id: string;
          provider:
            | "stripe"
            | "square"
            | "tyro"
            | "xero"
            | "myob"
            | "google_calendar"
            | "outlook"
            | "apple_calendar"
            | "google_business"
            | "meta"
            | "instagram";
          status: "disconnected" | "pending" | "connected" | "error";
          config: Json;
          connected_at: string | null;
          updated_at: string;
        };
        Insert: {
          salon_id: string;
          provider:
            | "stripe"
            | "square"
            | "tyro"
            | "xero"
            | "myob"
            | "google_calendar"
            | "outlook"
            | "apple_calendar"
            | "google_business"
            | "meta"
            | "instagram";
          status?: "disconnected" | "pending" | "connected" | "error";
          config?: Json;
          connected_at?: string | null;
          updated_at?: string;
        };
        Update: {
          salon_id?: string;
          provider?:
            | "stripe"
            | "square"
            | "tyro"
            | "xero"
            | "myob"
            | "google_calendar"
            | "outlook"
            | "apple_calendar"
            | "google_business"
            | "meta"
            | "instagram";
          status?: "disconnected" | "pending" | "connected" | "error";
          config?: Json;
          connected_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_integration_slots_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      settings_group_permissions: {
        Row: {
          role: "owner" | "admin" | "staff" | "platform_admin";
          group_key: string;
          can_read: boolean;
          can_write: boolean;
        };
        Insert: {
          role: "owner" | "admin" | "staff" | "platform_admin";
          group_key: string;
          can_read?: boolean;
          can_write?: boolean;
        };
        Update: {
          role?: "owner" | "admin" | "staff" | "platform_admin";
          group_key?: string;
          can_read?: boolean;
          can_write?: boolean;
        };
        Relationships: [];
      };
      salon_booking_policies: {
        Row: {
          salon_id: string;
          booking_enabled: boolean;
          allow_walk_ins: boolean;
          appointment_only: boolean;
          approval_required: boolean;
          instant_confirmation: boolean;
          max_advance_booking_days: number;
          min_notice_hours: number;
          payment_mode:
            | "booking_only"
            | "fixed_deposit"
            | "percentage_deposit"
            | "full_prepayment"
            | "card_hold";
          deposit_amount_cents: number | null;
          deposit_percent: number | null;
          currency: string;
          capture_mode:
            | "none"
            | "immediate"
            | "deposit"
            | "automatic_capture"
            | "manual_capture"
            | "card_hold";
          remaining_balance_in_salon: boolean;
          online_payment_enabled: boolean;
          cancellation_window_hours: number;
          cancellation_refund_percent: number;
          deposit_forfeiture_percent: number;
          no_show_action: "record_only" | "fee" | "charge_hold";
          no_show_fee_cents: number | null;
          refund_mode: "none" | "full" | "partial" | "policy_based";
          payment_provider:
            | "stripe_connect"
            | "square"
            | "tyro"
            | "paypal"
            | "gift_card"
            | "loyalty"
            | "membership"
            | "promo"
            | "package"
            | "invoice"
            | "manual"
            | null;
          provider_config: Json;
          extensions: Json;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          salon_id: string;
          booking_enabled?: boolean;
          allow_walk_ins?: boolean;
          appointment_only?: boolean;
          approval_required?: boolean;
          instant_confirmation?: boolean;
          max_advance_booking_days?: number;
          min_notice_hours?: number;
          payment_mode?:
            | "booking_only"
            | "fixed_deposit"
            | "percentage_deposit"
            | "full_prepayment"
            | "card_hold";
          deposit_amount_cents?: number | null;
          deposit_percent?: number | null;
          currency?: string;
          capture_mode?:
            | "none"
            | "immediate"
            | "deposit"
            | "automatic_capture"
            | "manual_capture"
            | "card_hold";
          remaining_balance_in_salon?: boolean;
          online_payment_enabled?: boolean;
          cancellation_window_hours?: number;
          cancellation_refund_percent?: number;
          deposit_forfeiture_percent?: number;
          no_show_action?: "record_only" | "fee" | "charge_hold";
          no_show_fee_cents?: number | null;
          refund_mode?: "none" | "full" | "partial" | "policy_based";
          payment_provider?:
            | "stripe_connect"
            | "square"
            | "tyro"
            | "paypal"
            | "gift_card"
            | "loyalty"
            | "membership"
            | "promo"
            | "package"
            | "invoice"
            | "manual"
            | null;
          provider_config?: Json;
          extensions?: Json;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          salon_id?: string;
          booking_enabled?: boolean;
          allow_walk_ins?: boolean;
          appointment_only?: boolean;
          approval_required?: boolean;
          instant_confirmation?: boolean;
          max_advance_booking_days?: number;
          min_notice_hours?: number;
          payment_mode?:
            | "booking_only"
            | "fixed_deposit"
            | "percentage_deposit"
            | "full_prepayment"
            | "card_hold";
          deposit_amount_cents?: number | null;
          deposit_percent?: number | null;
          currency?: string;
          capture_mode?:
            | "none"
            | "immediate"
            | "deposit"
            | "automatic_capture"
            | "manual_capture"
            | "card_hold";
          remaining_balance_in_salon?: boolean;
          online_payment_enabled?: boolean;
          cancellation_window_hours?: number;
          cancellation_refund_percent?: number;
          deposit_forfeiture_percent?: number;
          no_show_action?: "record_only" | "fee" | "charge_hold";
          no_show_fee_cents?: number | null;
          refund_mode?: "none" | "full" | "partial" | "policy_based";
          payment_provider?:
            | "stripe_connect"
            | "square"
            | "tyro"
            | "paypal"
            | "gift_card"
            | "loyalty"
            | "membership"
            | "promo"
            | "package"
            | "invoice"
            | "manual"
            | null;
          provider_config?: Json;
          extensions?: Json;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_booking_policies_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: true;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_service_policy_overrides: {
        Row: {
          service_id: string;
          salon_id: string;
          enabled: boolean;
          payment_mode:
            | "booking_only"
            | "fixed_deposit"
            | "percentage_deposit"
            | "full_prepayment"
            | "card_hold"
            | null;
          deposit_amount_cents: number | null;
          deposit_percent: number | null;
          capture_mode:
            | "none"
            | "immediate"
            | "deposit"
            | "automatic_capture"
            | "manual_capture"
            | "card_hold"
            | null;
          cancellation_window_hours: number | null;
          cancellation_refund_percent: number | null;
          deposit_forfeiture_percent: number | null;
          no_show_action: "record_only" | "fee" | "charge_hold" | null;
          no_show_fee_cents: number | null;
          refund_mode: "none" | "full" | "partial" | "policy_based" | null;
          online_payment_enabled: boolean | null;
          extensions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          service_id: string;
          salon_id: string;
          enabled?: boolean;
          payment_mode?:
            | "booking_only"
            | "fixed_deposit"
            | "percentage_deposit"
            | "full_prepayment"
            | "card_hold"
            | null;
          deposit_amount_cents?: number | null;
          deposit_percent?: number | null;
          capture_mode?:
            | "none"
            | "immediate"
            | "deposit"
            | "automatic_capture"
            | "manual_capture"
            | "card_hold"
            | null;
          cancellation_window_hours?: number | null;
          cancellation_refund_percent?: number | null;
          deposit_forfeiture_percent?: number | null;
          no_show_action?: "record_only" | "fee" | "charge_hold" | null;
          no_show_fee_cents?: number | null;
          refund_mode?: "none" | "full" | "partial" | "policy_based" | null;
          online_payment_enabled?: boolean | null;
          extensions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          service_id?: string;
          salon_id?: string;
          enabled?: boolean;
          payment_mode?:
            | "booking_only"
            | "fixed_deposit"
            | "percentage_deposit"
            | "full_prepayment"
            | "card_hold"
            | null;
          deposit_amount_cents?: number | null;
          deposit_percent?: number | null;
          capture_mode?:
            | "none"
            | "immediate"
            | "deposit"
            | "automatic_capture"
            | "manual_capture"
            | "card_hold"
            | null;
          cancellation_window_hours?: number | null;
          cancellation_refund_percent?: number | null;
          deposit_forfeiture_percent?: number | null;
          no_show_action?: "record_only" | "fee" | "charge_hold" | null;
          no_show_fee_cents?: number | null;
          refund_mode?: "none" | "full" | "partial" | "policy_based" | null;
          online_payment_enabled?: boolean | null;
          extensions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_service_policy_overrides_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: true;
            referencedRelation: "salon_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salon_service_policy_overrides_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_service_staff: {
        Row: {
          service_id: string;
          staff_id: string;
          created_at: string;
        };
        Insert: {
          service_id: string;
          staff_id: string;
          created_at?: string;
        };
        Update: {
          service_id?: string;
          staff_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_service_staff_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "salon_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salon_service_staff_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "salon_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_staff: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          position: string;
          photo_url: string | null;
          years_experience: number;
          languages: string[];
          specialties: string[];
          sort_order: number;
          is_active: boolean;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          email: string | null;
          phone: string | null;
          role: string;
          bio: string | null;
          instagram: string | null;
          certificates: string[];
          portfolio_images: string[];
          rating: number;
          booking_enabled: boolean;
          max_daily_bookings: number | null;
          max_weekly_bookings: number | null;
          buffer_minutes: number;
          status: "active" | "inactive" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          position: string;
          photo_url?: string | null;
          years_experience?: number;
          languages?: string[];
          specialties?: string[];
          sort_order?: number;
          is_active?: boolean;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: string;
          bio?: string | null;
          instagram?: string | null;
          certificates?: string[];
          portfolio_images?: string[];
          rating?: number;
          booking_enabled?: boolean;
          max_daily_bookings?: number | null;
          max_weekly_bookings?: number | null;
          buffer_minutes?: number;
          status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          position?: string;
          photo_url?: string | null;
          years_experience?: number;
          languages?: string[];
          specialties?: string[];
          sort_order?: number;
          is_active?: boolean;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: string;
          bio?: string | null;
          instagram?: string | null;
          certificates?: string[];
          portfolio_images?: string[];
          rating?: number;
          booking_enabled?: boolean;
          max_daily_bookings?: number | null;
          max_weekly_bookings?: number | null;
          buffer_minutes?: number;
          status?: "active" | "inactive" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_staff_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_staff_services: {
        Row: {
          staff_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          staff_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: {
          staff_id?: string;
          service_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_staff_services_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "salon_staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salon_staff_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "salon_services";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_staff_working_hours: {
        Row: {
          id: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_day_off: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_day_off?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_day_off?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_staff_working_hours_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "salon_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_staff_breaks: {
        Row: {
          id: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_type: "lunch" | "coffee" | "custom";
          label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_type?: "lunch" | "coffee" | "custom";
          label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          break_type?: "lunch" | "coffee" | "custom";
          label?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_staff_breaks_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "salon_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_staff_leaves: {
        Row: {
          id: string;
          staff_id: string;
          start_date: string;
          end_date: string;
          leave_type: "annual" | "sick" | "holiday" | "custom";
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          start_date: string;
          end_date: string;
          leave_type?: "annual" | "sick" | "holiday" | "custom";
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          start_date?: string;
          end_date?: string;
          leave_type?: "annual" | "sick" | "holiday" | "custom";
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_staff_leaves_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "salon_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_customers: {
        Row: {
          id: string;
          salon_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          first_name: string | null;
          last_name: string | null;
          birthday: string | null;
          gender: "female" | "male" | "non_binary" | "prefer_not" | "other" | null;
          avatar: string | null;
          status: "vip" | "regular" | "inactive" | "blocked";
          preferred_staff_id: string | null;
          loyalty_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          birthday?: string | null;
          gender?: "female" | "male" | "non_binary" | "prefer_not" | "other" | null;
          avatar?: string | null;
          status?: "vip" | "regular" | "inactive" | "blocked";
          preferred_staff_id?: string | null;
          loyalty_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          birthday?: string | null;
          gender?: "female" | "male" | "non_binary" | "prefer_not" | "other" | null;
          avatar?: string | null;
          status?: "vip" | "regular" | "inactive" | "blocked";
          preferred_staff_id?: string | null;
          loyalty_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_customers_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_customer_notes: {
        Row: {
          id: string;
          customer_id: string;
          staff_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          staff_id?: string | null;
          note: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          staff_id?: string | null;
          note?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_customer_notes_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "salon_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_customer_tags: {
        Row: {
          id: string;
          customer_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          tag: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          tag?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_customer_tags_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "salon_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_customer_statistics: {
        Row: {
          customer_id: string;
          total_bookings: number;
          completed_bookings: number;
          cancelled_bookings: number;
          total_spent: number;
          average_spent: number;
          last_visit: string | null;
          next_booking: string | null;
          preferred_staff_id: string | null;
          favorite_service_id: string | null;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          total_bookings?: number;
          completed_bookings?: number;
          cancelled_bookings?: number;
          total_spent?: number;
          average_spent?: number;
          last_visit?: string | null;
          next_booking?: string | null;
          preferred_staff_id?: string | null;
          favorite_service_id?: string | null;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          total_bookings?: number;
          completed_bookings?: number;
          cancelled_bookings?: number;
          total_spent?: number;
          average_spent?: number;
          last_visit?: string | null;
          next_booking?: string | null;
          preferred_staff_id?: string | null;
          favorite_service_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_customer_statistics_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: true;
            referencedRelation: "salon_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_customer_timeline: {
        Row: {
          id: string;
          customer_id: string;
          salon_id: string;
          event_type:
            | "booking_created"
            | "booking_completed"
            | "booking_cancelled"
            | "review_submitted"
            | "payment_completed"
            | "note_added"
            | "status_changed";
          title: string;
          detail: string | null;
          booking_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          salon_id: string;
          event_type:
            | "booking_created"
            | "booking_completed"
            | "booking_cancelled"
            | "review_submitted"
            | "payment_completed"
            | "note_added"
            | "status_changed";
          title: string;
          detail?: string | null;
          booking_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          salon_id?: string;
          event_type?:
            | "booking_created"
            | "booking_completed"
            | "booking_cancelled"
            | "review_submitted"
            | "payment_completed"
            | "note_added"
            | "status_changed";
          title?: string;
          detail?: string | null;
          booking_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_customer_timeline_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "salon_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_customer_media: {
        Row: {
          id: string;
          customer_id: string;
          url: string;
          media_type: "before" | "after" | "upload";
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          url: string;
          media_type?: "before" | "after" | "upload";
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          url?: string;
          media_type?: "before" | "after" | "upload";
          caption?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_customer_media_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "salon_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      salon_bookings: {
        Row: {
          id: string;
          salon_id: string;
          staff_id: string;
          customer_id: string | null;
          service_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration: number;
          buffer_minutes: number;
          status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          customer_name: string | null;
          customer_email: string | null;
          customer_phone: string | null;
          policy_snapshot: Json | null;
          policy_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          staff_id: string;
          customer_id?: string | null;
          service_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          duration: number;
          buffer_minutes?: number;
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          policy_snapshot?: Json | null;
          policy_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          staff_id?: string;
          customer_id?: string | null;
          service_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          duration?: number;
          buffer_minutes?: number;
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          policy_snapshot?: Json | null;
          policy_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "salon_bookings_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salon_bookings_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "salon_staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salon_bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "salon_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "salon_bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "salon_customers";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "favorites_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          salon_id: string;
          user_id: string | null;
          rating: number;
          comment: string | null;
          author_name: string | null;
          author_avatar: string | null;
          images: string[];
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          user_id?: string | null;
          rating: number;
          comment?: string | null;
          author_name?: string | null;
          author_avatar?: string | null;
          images?: string[];
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          user_id?: string | null;
          rating?: number;
          comment?: string | null;
          author_name?: string | null;
          author_avatar?: string | null;
          images?: string[];
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
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
          slug: string;
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
