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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          api_key: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          description: string
          features: string[] | null
          id: string
          images: Json | null
          is_featured: boolean | null
          location: string
          price_max: number
          price_min: number
          project_id: string | null
          project_name: string | null
          rooms: number
          source: string
          storia_link: string | null
          surface_max: number | null
          surface_min: number | null
          title: string
          transaction_type: string
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
          description: string
          features?: string[] | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          location: string
          price_max: number
          price_min: number
          project_id?: string | null
          project_name?: string | null
          rooms: number
          source?: string
          storia_link?: string | null
          surface_max?: number | null
          surface_min?: number | null
          title: string
          transaction_type?: string
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
          description?: string
          features?: string[] | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          location?: string
          price_max?: number
          price_min?: number
          project_id?: string | null
          project_name?: string | null
          rooms?: number
          source?: string
          storia_link?: string | null
          surface_max?: number | null
          surface_min?: number | null
          title?: string
          transaction_type?: string
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
      chat_conversations: {
        Row: {
          client_info: Json | null
          created_at: string | null
          id: string
          message: string
          role: string
          session_id: string
          timestamp: string | null
        }
        Insert: {
          client_info?: Json | null
          created_at?: string | null
          id?: string
          message: string
          role: string
          session_id: string
          timestamp?: string | null
        }
        Update: {
          client_info?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          role?: string
          session_id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      real_estate_projects: {
        Row: {
          amenities: string[]
          available_units: number | null
          completion_date: string | null
          created_at: string | null
          description: string
          detailed_info: Json | null
          developer: string | null
          features: string[]
          id: string
          investment_details: string | null
          is_recommended: boolean | null
          location: string
          location_advantages: string[]
          name: string
          payment_plans: string[]
          price_range: string
          rooms_range: string
          status: string | null
          surface_range: string
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          amenities?: string[]
          available_units?: number | null
          completion_date?: string | null
          created_at?: string | null
          description: string
          detailed_info?: Json | null
          developer?: string | null
          features?: string[]
          id?: string
          investment_details?: string | null
          is_recommended?: boolean | null
          location: string
          location_advantages?: string[]
          name: string
          payment_plans?: string[]
          price_range: string
          rooms_range: string
          status?: string | null
          surface_range: string
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          amenities?: string[]
          available_units?: number | null
          completion_date?: string | null
          created_at?: string | null
          description?: string
          detailed_info?: Json | null
          developer?: string | null
          features?: string[]
          id?: string
          investment_details?: string | null
          is_recommended?: boolean | null
          location?: string
          location_advantages?: string[]
          name?: string
          payment_plans?: string[]
          price_range?: string
          rooms_range?: string
          status?: string | null
          surface_range?: string
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_conversations_summary: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          client_info: Json
          conversation_start: string
          first_user_message: string
          message_count: number
          session_id: string
        }[]
      }
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
