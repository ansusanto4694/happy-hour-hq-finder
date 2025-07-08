export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
      happy_hour_deals: {
        Row: {
          active: boolean
          created_at: string
          deal_description: string | null
          deal_title: string
          display_order: number | null
          id: string
          restaurant_id: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deal_description?: string | null
          deal_title: string
          display_order?: number | null
          id?: string
          restaurant_id: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deal_description?: string | null
          deal_title?: string
          display_order?: number | null
          id?: string
          restaurant_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "happy_hour_deals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "Merchant"
            referencedColumns: ["id"]
          },
        ]
      }
      Merchant: {
        Row: {
          city: string
          created_at: string
          geocoded_at: string | null
          id: number
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          restaurant_name: string
          state: string
          street_address: string
          street_address_line_2: string | null
          updated_at: string
          website: string | null
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          restaurant_name: string
          state: string
          street_address: string
          street_address_line_2?: string | null
          updated_at?: string
          website?: string | null
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          geocoded_at?: string | null
          id?: number
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          restaurant_name?: string
          state?: string
          street_address?: string
          street_address_line_2?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string
        }
        Relationships: []
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
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_merchant_coordinates: {
        Args: { merchant_id: number; latitude: number; longitude: number }
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
