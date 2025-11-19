export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      business: {
        Row: {
          business_name: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      carousel_merchants: {
        Row: {
          added_at: string
          carousel_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          merchant_id: number
          removed_at: string | null
          updated_at: string
        }
        Insert: {
          added_at?: string
          carousel_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          merchant_id: number
          removed_at?: string | null
          updated_at?: string
        }
        Update: {
          added_at?: string
          carousel_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          merchant_id?: number
          removed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carousel_merchants_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "homepage_carousels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_merchants_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_merchants_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          completed_at: string
          created_at: string
          funnel_step: string
          id: string
          merchant_id: number | null
          session_id: string
          step_order: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          funnel_step: string
          id?: string
          merchant_id?: number | null
          session_id: string
          step_order: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          funnel_step?: string
          id?: string
          merchant_id?: number | null
          session_id?: string
          step_order?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      happy_hour_deals: {
        Row: {
          active: boolean
          created_at: string
          deal_description: string | null
          deal_title: string
          display_order: number | null
          id: string
          is_verified: boolean
          restaurant_id: number
          source_label: string | null
          source_url: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          deal_description?: string | null
          deal_title: string
          display_order?: number | null
          id?: string
          is_verified?: boolean
          restaurant_id: number
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          deal_description?: string | null
          deal_title?: string
          display_order?: number | null
          id?: string
          is_verified?: boolean
          restaurant_id?: number
          source_label?: string | null
          source_url?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "happy_hour_deals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "happy_hour_deals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "happy_hour_deals_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_carousels: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      location_cache: {
        Row: {
          canonical_city: string
          canonical_state: string
          created_at: string
          east_lng: number | null
          id: string
          latitude: number
          location_type: string | null
          longitude: number
          neighborhood_name: string | null
          north_lat: number | null
          original_input: string
          south_lat: number | null
          west_lng: number | null
        }
        Insert: {
          canonical_city: string
          canonical_state: string
          created_at?: string
          east_lng?: number | null
          id?: string
          latitude: number
          location_type?: string | null
          longitude: number
          neighborhood_name?: string | null
          north_lat?: number | null
          original_input: string
          south_lat?: number | null
          west_lng?: number | null
        }
        Update: {
          canonical_city?: string
          canonical_state?: string
          created_at?: string
          east_lng?: number | null
          id?: string
          latitude?: number
          location_type?: string | null
          longitude?: number
          neighborhood_name?: string | null
          north_lat?: number | null
          original_input?: string
          south_lat?: number | null
          west_lng?: number | null
        }
        Relationships: []
      }
      Merchant: {
        Row: {
          business_id: string | null
          city: string
          created_at: string
          geocoded_at: string | null
          id: number
          is_active: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          neighborhood: string | null
          phone_number: string | null
          restaurant_name: string
          state: string
          street_address: string
          street_address_line_2: string | null
          updated_at: string
          verification_is_verified: boolean
          verification_source_label: string | null
          verification_source_url: string | null
          verification_verified_at: string | null
          verification_verified_by: string | null
          website: string | null
          zip_code: string
        }
        Insert: {
          business_id?: string | null
          city: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          neighborhood?: string | null
          phone_number?: string | null
          restaurant_name: string
          state: string
          street_address: string
          street_address_line_2?: string | null
          updated_at?: string
          verification_is_verified?: boolean
          verification_source_label?: string | null
          verification_source_url?: string | null
          verification_verified_at?: string | null
          verification_verified_by?: string | null
          website?: string | null
          zip_code: string
        }
        Update: {
          business_id?: string | null
          city?: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          is_active?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          neighborhood?: string | null
          phone_number?: string | null
          restaurant_name?: string
          state?: string
          street_address?: string
          street_address_line_2?: string | null
          updated_at?: string
          verification_is_verified?: boolean
          verification_source_label?: string | null
          verification_source_url?: string | null
          verification_verified_at?: string | null
          verification_verified_by?: string | null
          website?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "Merchant_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_verification_verified_by_fkey"
            columns: ["verification_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          merchant_id: number
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          merchant_id: number
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          merchant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "merchant_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_categories_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_categories_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: number
          image_url: string | null
          restaurant_id: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: number
          image_url?: string | null
          restaurant_id: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: number
          image_url?: string | null
          restaurant_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_happy_hour: {
        Row: {
          created_at: string
          day_of_week: number
          happy_hour_end: string
          happy_hour_start: string
          id: string
          store_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          happy_hour_end: string
          happy_hour_start: string
          id?: string
          store_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          happy_hour_end?: string
          happy_hour_start?: string
          id?: string
          store_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_happy_hour_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_happy_hour_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_listing_issue: {
        Row: {
          additional_feedback: string | null
          created_at: string
          id: string
          issue_types: string[]
          merchant_id: number
          reporter_email: string | null
          updated_at: string
        }
        Insert: {
          additional_feedback?: string | null
          created_at?: string
          id?: string
          issue_types: string[]
          merchant_id: number
          reporter_email?: string | null
          updated_at?: string
        }
        Update: {
          additional_feedback?: string | null
          created_at?: string
          id?: string
          issue_types?: string[]
          merchant_id?: number
          reporter_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_listing_issue_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_listing_issue_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_offers: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          offer_description: string | null
          offer_name: string
          start_time: string
          store_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          offer_description?: string | null
          offer_name: string
          start_time: string
          store_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          offer_description?: string | null
          offer_name?: string
          start_time?: string
          store_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          anonymous_user_id: string | null
          carousel_id: string | null
          created_at: string
          event_action: string
          event_category: string
          event_label: string | null
          event_type: string
          id: string
          is_mobile: boolean
          location_query: string | null
          merchant_id: number | null
          metadata: Json | null
          page_path: string
          search_term: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          anonymous_user_id?: string | null
          carousel_id?: string | null
          created_at?: string
          event_action: string
          event_category: string
          event_label?: string | null
          event_type: string
          id?: string
          is_mobile?: boolean
          location_query?: string | null
          merchant_id?: number | null
          metadata?: Json | null
          page_path: string
          search_term?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          anonymous_user_id?: string | null
          carousel_id?: string | null
          created_at?: string
          event_action?: string
          event_category?: string
          event_label?: string | null
          event_type?: string
          id?: string
          is_mobile?: boolean
          location_query?: string | null
          merchant_id?: number | null
          metadata?: Json | null
          page_path?: string
          search_term?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "homepage_carousels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "restaurants_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          anonymous_user_id: string | null
          bot_type: string | null
          created_at: string
          device_type: string
          entry_page: string
          exit_page: string | null
          first_seen: string
          id: string
          is_bot: boolean
          is_bounce: boolean
          last_seen: string
          page_views: number
          referrer_category: string | null
          referrer_platform: string | null
          referrer_source: string | null
          session_duration_seconds: number | null
          session_id: string
          total_events: number
          updated_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          anonymous_user_id?: string | null
          bot_type?: string | null
          created_at?: string
          device_type: string
          entry_page: string
          exit_page?: string | null
          first_seen?: string
          id?: string
          is_bot?: boolean
          is_bounce?: boolean
          last_seen?: string
          page_views?: number
          referrer_category?: string | null
          referrer_platform?: string | null
          referrer_source?: string | null
          session_duration_seconds?: number | null
          session_id: string
          total_events?: number
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          anonymous_user_id?: string | null
          bot_type?: string | null
          created_at?: string
          device_type?: string
          entry_page?: string
          exit_page?: string | null
          first_seen?: string
          id?: string
          is_bot?: boolean
          is_bounce?: boolean
          last_seen?: string
          page_views?: number
          referrer_category?: string | null
          referrer_platform?: string | null
          referrer_source?: string | null
          session_duration_seconds?: number | null
          session_id?: string
          total_events?: number
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurants_public: {
        Row: {
          city: string | null
          created_at: string | null
          id: number | null
          is_active: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          phone_number: string | null
          restaurant_name: string | null
          state: string | null
          street_address: string | null
          street_address_line_2: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          phone_number?: string | null
          restaurant_name?: string | null
          state?: string | null
          street_address?: string | null
          street_address_line_2?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: number | null
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          phone_number?: string | null
          restaurant_name?: string | null
          state?: string | null
          street_address?: string | null
          street_address_line_2?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_user_events_partition: {
        Args: { partition_date: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_restaurant_details: {
        Args: { restaurant_id: number }
        Returns: {
          city: string
          created_at: string
          id: number
          is_active: boolean
          latitude: number
          logo_url: string
          longitude: number
          phone_number: string
          restaurant_name: string
          state: string
          street_address: string
          street_address_line_2: string
          updated_at: string
          website: string
          zip_code: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      maintain_user_events_partitions: { Args: never; Returns: undefined }
      update_merchant_coordinates: {
        Args: { latitude: number; longitude: number; merchant_id: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "restaurant_owner" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "restaurant_owner", "user"],
    },
  },
} as const
