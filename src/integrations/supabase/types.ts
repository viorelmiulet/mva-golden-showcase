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
          created_at: string
          currency: string | null
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
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
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          availability_status?: string | null
          available_units?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
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
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          availability_status?: string | null
          available_units?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
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
          updated_at?: string
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
    Enums: {},
  },
} as const
