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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      business_cards: {
        Row: {
          back_svg: string
          created_at: string
          email: string
          front_svg: string
          function_title: string
          id: string
          name: string
          phone: string
          qr_link: string | null
        }
        Insert: {
          back_svg: string
          created_at?: string
          email: string
          front_svg: string
          function_title: string
          id?: string
          name: string
          phone: string
          qr_link?: string | null
        }
        Update: {
          back_svg?: string
          created_at?: string
          email?: string
          front_svg?: string
          function_title?: string
          id?: string
          name?: string
          phone?: string
          qr_link?: string | null
        }
        Relationships: []
      }
      catalog_offers: {
        Row: {
          amenities: string[] | null
          availability_status: string | null
          available_units: number | null
          contact_info: Json | null
          created_at: string
          currency: string | null
          description: string | null
          features: string[] | null
          floor_plan: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          location: string | null
          price_max: number | null
          price_min: number | null
          project_id: string | null
          project_name: string | null
          rooms: number | null
          source: string | null
          storia_link: string | null
          surface_max: number | null
          surface_min: number | null
          title: string
          transaction_type: string | null
          updated_at: string
          whatsapp_catalog_id: string | null
        }
        Insert: {
          amenities?: string[] | null
          availability_status?: string | null
          available_units?: number | null
          contact_info?: Json | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: string[] | null
          floor_plan?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          location?: string | null
          price_max?: number | null
          price_min?: number | null
          project_id?: string | null
          project_name?: string | null
          rooms?: number | null
          source?: string | null
          storia_link?: string | null
          surface_max?: number | null
          surface_min?: number | null
          title: string
          transaction_type?: string | null
          updated_at?: string
          whatsapp_catalog_id?: string | null
        }
        Update: {
          amenities?: string[] | null
          availability_status?: string | null
          available_units?: number | null
          contact_info?: Json | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: string[] | null
          floor_plan?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          location?: string | null
          price_max?: number | null
          price_min?: number | null
          project_id?: string | null
          project_name?: string | null
          rooms?: number | null
          source?: string | null
          storia_link?: string | null
          surface_max?: number | null
          surface_min?: number | null
          title?: string
          transaction_type?: string | null
          updated_at?: string
          whatsapp_catalog_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_offers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "real_estate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          id: string
          invoice_file_url: string | null
          invoice_number: string | null
          notes: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          date: string
          id?: string
          invoice_file_url?: string | null
          invoice_number?: string | null
          notes?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          id?: string
          invoice_file_url?: string | null
          invoice_number?: string | null
          notes?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      complexes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      real_estate_projects: {
        Row: {
          amenities: string[] | null
          completion_date: string | null
          created_at: string
          description: string | null
          developer: string | null
          features: string[] | null
          id: string
          investment_details: string | null
          is_recommended: boolean | null
          location: string | null
          location_advantages: string[] | null
          main_image: string | null
          name: string
          payment_plans: string[] | null
          price_range: string | null
          rooms_range: string | null
          status: string | null
          surface_range: string | null
          updated_at: string
          videos: Json | null
        }
        Insert: {
          amenities?: string[] | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          developer?: string | null
          features?: string[] | null
          id?: string
          investment_details?: string | null
          is_recommended?: boolean | null
          location?: string | null
          location_advantages?: string[] | null
          main_image?: string | null
          name: string
          payment_plans?: string[] | null
          price_range?: string | null
          rooms_range?: string | null
          status?: string | null
          surface_range?: string | null
          updated_at?: string
          videos?: Json | null
        }
        Update: {
          amenities?: string[] | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          developer?: string | null
          features?: string[] | null
          id?: string
          investment_details?: string | null
          is_recommended?: boolean | null
          location?: string | null
          location_advantages?: string[] | null
          main_image?: string | null
          name?: string
          payment_plans?: string[] | null
          price_range?: string | null
          rooms_range?: string | null
          status?: string | null
          surface_range?: string | null
          updated_at?: string
          videos?: Json | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      sitemap_notifications: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      user_complexes: {
        Row: {
          complex_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          complex_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          complex_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_complexes_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_complexes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viewing_appointments: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          message: string | null
          notes: string | null
          preferred_date: string
          preferred_time: string
          property_id: string | null
          property_title: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          message?: string | null
          notes?: string | null
          preferred_date: string
          preferred_time: string
          property_id?: string | null
          property_title: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          message?: string | null
          notes?: string | null
          preferred_date?: string
          preferred_time?: string
          property_id?: string | null
          property_title?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewing_appointments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "catalog_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      xml_import_sources: {
        Row: {
          created_at: string
          id: string
          import_count: number
          last_mapping: Json | null
          last_used_at: string
          name: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_count?: number
          last_mapping?: Json | null
          last_used_at?: string
          name?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          import_count?: number
          last_mapping?: Json | null
          last_used_at?: string
          name?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_google_sitemap: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "agent" | "visitor"
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
      app_role: ["admin", "agent", "visitor"],
    },
  },
} as const
