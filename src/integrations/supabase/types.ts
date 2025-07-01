export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          id: number
          merchant_type: string | null
          phone_number: string | null
          restaurant_name: string
          state: string
          street_address: string
          street_address_line_2: string | null
          updated_at: string
          zip_code: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: number
          merchant_type?: string | null
          phone_number?: string | null
          restaurant_name: string
          state: string
          street_address: string
          street_address_line_2?: string | null
          updated_at?: string
          zip_code: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: number
          merchant_type?: string | null
          phone_number?: string | null
          restaurant_name?: string
          state?: string
          street_address?: string
          street_address_line_2?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
