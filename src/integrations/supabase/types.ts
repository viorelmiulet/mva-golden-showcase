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
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          record_title: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          record_title?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          record_title?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          category_id: string
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          featured: boolean | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          read_time: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string
          category_id?: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          category_id?: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string
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
          agency: string | null
          agency_id: string | null
          agent: string | null
          amenities: string[] | null
          appartment_type: string | null
          availability_status: string | null
          available_units: number | null
          balconies: number | null
          bathrooms: number | null
          broker_id: string | null
          build_materials: string | null
          building_type: string | null
          city: string | null
          comfort: string | null
          commission_type: string | null
          commission_value: number | null
          compartment: string | null
          contact_info: Json | null
          created_at: string
          crm_source: string | null
          currency: string | null
          date_added: string | null
          descriere_lunga: string | null
          description: string | null
          exclusivity: boolean | null
          external_id: string | null
          features: string[] | null
          floor: number | null
          floor_plan: string | null
          furnished: string | null
          has_ac: boolean | null
          has_electricity: boolean | null
          has_gas: boolean | null
          has_internet: boolean | null
          has_phone: boolean | null
          has_security: boolean | null
          has_tv: boolean | null
          has_water: boolean | null
          has_wood_floors: boolean | null
          heating: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_published: boolean | null
          kitchens: number | null
          latitude: number | null
          location: string | null
          longitude: number | null
          parking: number | null
          price_max: number | null
          price_min: number | null
          price_type: string | null
          project_id: string | null
          project_name: string | null
          promotion_type: string | null
          property_subtype: string | null
          property_type: string | null
          rooms: number | null
          source: string | null
          source_url: string | null
          storia_link: string | null
          surface_land: number | null
          surface_max: number | null
          surface_min: number | null
          title: string
          total_floors: number | null
          transaction_type: string | null
          updated_at: string
          video: string | null
          virtual_tour: string | null
          whatsapp_catalog_id: string | null
          year_built: number | null
          zone: string | null
        }
        Insert: {
          agency?: string | null
          agency_id?: string | null
          agent?: string | null
          amenities?: string[] | null
          appartment_type?: string | null
          availability_status?: string | null
          available_units?: number | null
          balconies?: number | null
          bathrooms?: number | null
          broker_id?: string | null
          build_materials?: string | null
          building_type?: string | null
          city?: string | null
          comfort?: string | null
          commission_type?: string | null
          commission_value?: number | null
          compartment?: string | null
          contact_info?: Json | null
          created_at?: string
          crm_source?: string | null
          currency?: string | null
          date_added?: string | null
          descriere_lunga?: string | null
          description?: string | null
          exclusivity?: boolean | null
          external_id?: string | null
          features?: string[] | null
          floor?: number | null
          floor_plan?: string | null
          furnished?: string | null
          has_ac?: boolean | null
          has_electricity?: boolean | null
          has_gas?: boolean | null
          has_internet?: boolean | null
          has_phone?: boolean | null
          has_security?: boolean | null
          has_tv?: boolean | null
          has_water?: boolean | null
          has_wood_floors?: boolean | null
          heating?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          kitchens?: number | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          parking?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
          project_id?: string | null
          project_name?: string | null
          promotion_type?: string | null
          property_subtype?: string | null
          property_type?: string | null
          rooms?: number | null
          source?: string | null
          source_url?: string | null
          storia_link?: string | null
          surface_land?: number | null
          surface_max?: number | null
          surface_min?: number | null
          title: string
          total_floors?: number | null
          transaction_type?: string | null
          updated_at?: string
          video?: string | null
          virtual_tour?: string | null
          whatsapp_catalog_id?: string | null
          year_built?: number | null
          zone?: string | null
        }
        Update: {
          agency?: string | null
          agency_id?: string | null
          agent?: string | null
          amenities?: string[] | null
          appartment_type?: string | null
          availability_status?: string | null
          available_units?: number | null
          balconies?: number | null
          bathrooms?: number | null
          broker_id?: string | null
          build_materials?: string | null
          building_type?: string | null
          city?: string | null
          comfort?: string | null
          commission_type?: string | null
          commission_value?: number | null
          compartment?: string | null
          contact_info?: Json | null
          created_at?: string
          crm_source?: string | null
          currency?: string | null
          date_added?: string | null
          descriere_lunga?: string | null
          description?: string | null
          exclusivity?: boolean | null
          external_id?: string | null
          features?: string[] | null
          floor?: number | null
          floor_plan?: string | null
          furnished?: string | null
          has_ac?: boolean | null
          has_electricity?: boolean | null
          has_gas?: boolean | null
          has_internet?: boolean | null
          has_phone?: boolean | null
          has_security?: boolean | null
          has_tv?: boolean | null
          has_water?: boolean | null
          has_wood_floors?: boolean | null
          heating?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          kitchens?: number | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          parking?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
          project_id?: string | null
          project_name?: string | null
          promotion_type?: string | null
          property_subtype?: string | null
          property_type?: string | null
          rooms?: number | null
          source?: string | null
          source_url?: string | null
          storia_link?: string | null
          surface_land?: number | null
          surface_max?: number | null
          surface_min?: number | null
          title?: string
          total_floors?: number | null
          transaction_type?: string | null
          updated_at?: string
          video?: string | null
          virtual_tour?: string | null
          whatsapp_catalog_id?: string | null
          year_built?: number | null
          zone?: string | null
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
      comodat_contracts: {
        Row: {
          comodant_adresa: string | null
          comodant_ci_data_emiterii: string | null
          comodant_ci_emitent: string | null
          comodant_cnp: string | null
          comodant_email: string | null
          comodant_name: string
          comodant_numar_ci: string | null
          comodant_phone: string | null
          comodant_prenume: string | null
          comodant_seria_ci: string | null
          comodant_signature: string | null
          comodant_signed_at: string | null
          comodatar_adresa: string | null
          comodatar_ci_data_emiterii: string | null
          comodatar_ci_emitent: string | null
          comodatar_cnp: string | null
          comodatar_email: string | null
          comodatar_name: string
          comodatar_numar_ci: string | null
          comodatar_phone: string | null
          comodatar_prenume: string | null
          comodatar_seria_ci: string | null
          comodatar_signature: string | null
          comodatar_signed_at: string | null
          contract_date: string
          created_at: string
          docx_url: string | null
          duration_months: number | null
          id: string
          pdf_url: string | null
          property_address: string
          property_features: string | null
          property_rooms: number | null
          property_surface: number | null
          property_type: string | null
          purpose: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          comodant_adresa?: string | null
          comodant_ci_data_emiterii?: string | null
          comodant_ci_emitent?: string | null
          comodant_cnp?: string | null
          comodant_email?: string | null
          comodant_name: string
          comodant_numar_ci?: string | null
          comodant_phone?: string | null
          comodant_prenume?: string | null
          comodant_seria_ci?: string | null
          comodant_signature?: string | null
          comodant_signed_at?: string | null
          comodatar_adresa?: string | null
          comodatar_ci_data_emiterii?: string | null
          comodatar_ci_emitent?: string | null
          comodatar_cnp?: string | null
          comodatar_email?: string | null
          comodatar_name: string
          comodatar_numar_ci?: string | null
          comodatar_phone?: string | null
          comodatar_prenume?: string | null
          comodatar_seria_ci?: string | null
          comodatar_signature?: string | null
          comodatar_signed_at?: string | null
          contract_date: string
          created_at?: string
          docx_url?: string | null
          duration_months?: number | null
          id?: string
          pdf_url?: string | null
          property_address: string
          property_features?: string | null
          property_rooms?: number | null
          property_surface?: number | null
          property_type?: string | null
          purpose?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          comodant_adresa?: string | null
          comodant_ci_data_emiterii?: string | null
          comodant_ci_emitent?: string | null
          comodant_cnp?: string | null
          comodant_email?: string | null
          comodant_name?: string
          comodant_numar_ci?: string | null
          comodant_phone?: string | null
          comodant_prenume?: string | null
          comodant_seria_ci?: string | null
          comodant_signature?: string | null
          comodant_signed_at?: string | null
          comodatar_adresa?: string | null
          comodatar_ci_data_emiterii?: string | null
          comodatar_ci_emitent?: string | null
          comodatar_cnp?: string | null
          comodatar_email?: string | null
          comodatar_name?: string
          comodatar_numar_ci?: string | null
          comodatar_phone?: string | null
          comodatar_prenume?: string | null
          comodatar_seria_ci?: string | null
          comodatar_signature?: string | null
          comodatar_signed_at?: string | null
          contract_date?: string
          created_at?: string
          docx_url?: string | null
          duration_months?: number | null
          id?: string
          pdf_url?: string | null
          property_address?: string
          property_features?: string | null
          property_rooms?: number | null
          property_surface?: number | null
          property_type?: string | null
          purpose?: string | null
          start_date?: string | null
          status?: string | null
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
      contract_clauses: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          section_key: string
          section_title: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          section_key: string
          section_title: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          section_key?: string
          section_title?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_inventory: {
        Row: {
          condition: string | null
          contract_id: string | null
          created_at: string
          id: string
          images: string[] | null
          item_name: string
          location: string | null
          notes: string | null
          quantity: number | null
        }
        Insert: {
          condition?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          item_name: string
          location?: string | null
          notes?: string | null
          quantity?: number | null
        }
        Update: {
          condition?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          item_name?: string
          location?: string | null
          notes?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_inventory_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          party_type: string
          signature_data: string | null
          signature_token: string
          signed_at: string | null
          signer_email: string | null
          signer_name: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          party_type: string
          signature_data?: string | null
          signature_token?: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          party_type?: string
          signature_data?: string | null
          signature_token?: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          advance_percent: string | null
          chirias_signed: boolean | null
          client_adresa: string | null
          client_ci_data_emiterii: string | null
          client_ci_emitent: string | null
          client_cnp: string | null
          client_name: string
          client_numar_ci: string | null
          client_prenume: string | null
          client_seria_ci: string | null
          contract_date: string
          contract_type: string
          created_at: string
          docx_url: string | null
          duration_months: number | null
          garantie_amount: number | null
          garantie_status: string | null
          id: string
          notes: string | null
          pdf_generated: boolean | null
          pdf_url: string | null
          property_address: string
          property_currency: string | null
          property_price: number | null
          property_surface: number | null
          proprietar_adresa: string | null
          proprietar_ci_data_emiterii: string | null
          proprietar_ci_emitent: string | null
          proprietar_cnp: string | null
          proprietar_name: string | null
          proprietar_numar_ci: string | null
          proprietar_prenume: string | null
          proprietar_seria_ci: string | null
          proprietar_signed: boolean | null
        }
        Insert: {
          advance_percent?: string | null
          chirias_signed?: boolean | null
          client_adresa?: string | null
          client_ci_data_emiterii?: string | null
          client_ci_emitent?: string | null
          client_cnp?: string | null
          client_name: string
          client_numar_ci?: string | null
          client_prenume?: string | null
          client_seria_ci?: string | null
          contract_date: string
          contract_type: string
          created_at?: string
          docx_url?: string | null
          duration_months?: number | null
          garantie_amount?: number | null
          garantie_status?: string | null
          id?: string
          notes?: string | null
          pdf_generated?: boolean | null
          pdf_url?: string | null
          property_address: string
          property_currency?: string | null
          property_price?: number | null
          property_surface?: number | null
          proprietar_adresa?: string | null
          proprietar_ci_data_emiterii?: string | null
          proprietar_ci_emitent?: string | null
          proprietar_cnp?: string | null
          proprietar_name?: string | null
          proprietar_numar_ci?: string | null
          proprietar_prenume?: string | null
          proprietar_seria_ci?: string | null
          proprietar_signed?: boolean | null
        }
        Update: {
          advance_percent?: string | null
          chirias_signed?: boolean | null
          client_adresa?: string | null
          client_ci_data_emiterii?: string | null
          client_ci_emitent?: string | null
          client_cnp?: string | null
          client_name?: string
          client_numar_ci?: string | null
          client_prenume?: string | null
          client_seria_ci?: string | null
          contract_date?: string
          contract_type?: string
          created_at?: string
          docx_url?: string | null
          duration_months?: number | null
          garantie_amount?: number | null
          garantie_status?: string | null
          id?: string
          notes?: string | null
          pdf_generated?: boolean | null
          pdf_url?: string | null
          property_address?: string
          property_currency?: string | null
          property_price?: number | null
          property_surface?: number | null
          proprietar_adresa?: string | null
          proprietar_ci_data_emiterii?: string | null
          proprietar_ci_emitent?: string | null
          proprietar_cnp?: string | null
          proprietar_name?: string | null
          proprietar_numar_ci?: string | null
          proprietar_prenume?: string | null
          proprietar_seria_ci?: string | null
          proprietar_signed?: boolean | null
        }
        Relationships: []
      }
      email_contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          last_used_at: string
          name: string | null
          use_count: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_used_at?: string
          name?: string | null
          use_count?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_used_at?: string
          name?: string | null
          use_count?: number
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          attachments: Json | null
          bcc: string | null
          body: string | null
          cc: string | null
          created_at: string
          id: string
          recipient: string | null
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          bcc?: string | null
          body?: string | null
          cc?: string | null
          created_at?: string
          id?: string
          recipient?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          bcc?: string | null
          body?: string | null
          cc?: string | null
          created_at?: string
          id?: string
          recipient?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_function_settings: {
        Row: {
          created_at: string
          from_email: string
          from_name: string | null
          function_label: string
          function_name: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name?: string | null
          function_label: string
          function_name: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string | null
          function_label?: string
          function_name?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_path: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_path?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_path?: string | null
          session_id?: string
        }
        Relationships: []
      }
      exclusive_contracts: {
        Row: {
          agent_signature: string | null
          agent_signed_at: string | null
          beneficiary_adresa: string | null
          beneficiary_ci_data_emiterii: string | null
          beneficiary_ci_emitent: string | null
          beneficiary_cnp: string | null
          beneficiary_email: string | null
          beneficiary_name: string
          beneficiary_numar_ci: string | null
          beneficiary_phone: string | null
          beneficiary_prenume: string | null
          beneficiary_seria_ci: string | null
          beneficiary_signature: string | null
          beneficiary_signed_at: string | null
          commission_percent: number | null
          contract_date: string
          created_at: string
          currency: string | null
          duration_months: number | null
          id: string
          pdf_url: string | null
          property_address: string
          property_features: string | null
          property_land_surface: number | null
          property_rooms: number | null
          property_surface: number | null
          property_type: string | null
          sales_price: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          agent_signature?: string | null
          agent_signed_at?: string | null
          beneficiary_adresa?: string | null
          beneficiary_ci_data_emiterii?: string | null
          beneficiary_ci_emitent?: string | null
          beneficiary_cnp?: string | null
          beneficiary_email?: string | null
          beneficiary_name: string
          beneficiary_numar_ci?: string | null
          beneficiary_phone?: string | null
          beneficiary_prenume?: string | null
          beneficiary_seria_ci?: string | null
          beneficiary_signature?: string | null
          beneficiary_signed_at?: string | null
          commission_percent?: number | null
          contract_date: string
          created_at?: string
          currency?: string | null
          duration_months?: number | null
          id?: string
          pdf_url?: string | null
          property_address: string
          property_features?: string | null
          property_land_surface?: number | null
          property_rooms?: number | null
          property_surface?: number | null
          property_type?: string | null
          sales_price?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          agent_signature?: string | null
          agent_signed_at?: string | null
          beneficiary_adresa?: string | null
          beneficiary_ci_data_emiterii?: string | null
          beneficiary_ci_emitent?: string | null
          beneficiary_cnp?: string | null
          beneficiary_email?: string | null
          beneficiary_name?: string
          beneficiary_numar_ci?: string | null
          beneficiary_phone?: string | null
          beneficiary_prenume?: string | null
          beneficiary_seria_ci?: string | null
          beneficiary_signature?: string | null
          beneficiary_signed_at?: string | null
          commission_percent?: number | null
          contract_date?: string
          created_at?: string
          currency?: string | null
          duration_months?: number | null
          id?: string
          pdf_url?: string | null
          property_address?: string
          property_features?: string | null
          property_land_surface?: number | null
          property_rooms?: number | null
          property_surface?: number | null
          property_type?: string | null
          sales_price?: number | null
          status?: string | null
          updated_at?: string
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
      page_views: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          id: string
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      preset_inventory_items: {
        Row: {
          condition: string | null
          created_at: string
          id: string
          item_name: string
          location: string | null
          notes: string | null
          quantity: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          id?: string
          item_name: string
          location?: string | null
          notes?: string | null
          quantity?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          id?: string
          item_name?: string
          location?: string | null
          notes?: string | null
          quantity?: number
          sort_order?: number | null
          updated_at?: string
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
          is_published: boolean | null
          is_recommended: boolean | null
          location: string | null
          location_advantages: string[] | null
          main_image: string | null
          name: string
          payment_plans: string[] | null
          price_range: string | null
          rooms_range: string | null
          slug: string | null
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
          is_published?: boolean | null
          is_recommended?: boolean | null
          location?: string | null
          location_advantages?: string[] | null
          main_image?: string | null
          name: string
          payment_plans?: string[] | null
          price_range?: string | null
          rooms_range?: string | null
          slug?: string | null
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
          is_published?: boolean | null
          is_recommended?: boolean | null
          location?: string | null
          location_advantages?: string[] | null
          main_image?: string | null
          name?: string
          payment_plans?: string[] | null
          price_range?: string | null
          rooms_range?: string | null
          slug?: string | null
          status?: string | null
          surface_range?: string | null
          updated_at?: string
          videos?: Json | null
        }
        Relationships: []
      }
      received_emails: {
        Row: {
          attachments: Json | null
          body_html: string | null
          body_plain: string | null
          created_at: string
          id: string
          in_reply_to: string | null
          is_archived: boolean | null
          is_deleted: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          message_id: string | null
          received_at: string
          recipient: string | null
          sender: string
          stripped_text: string | null
          subject: string | null
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          body_plain?: string | null
          created_at?: string
          id?: string
          in_reply_to?: string | null
          is_archived?: boolean | null
          is_deleted?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          message_id?: string | null
          received_at?: string
          recipient?: string | null
          sender: string
          stripped_text?: string | null
          subject?: string | null
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          body_plain?: string | null
          created_at?: string
          id?: string
          in_reply_to?: string | null
          is_archived?: boolean | null
          is_deleted?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          message_id?: string | null
          received_at?: string
          recipient?: string | null
          sender?: string
          stripped_text?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      sent_emails: {
        Row: {
          attachments: Json | null
          bcc: string | null
          body_html: string | null
          body_plain: string | null
          cc: string | null
          created_at: string
          from_address: string
          id: string
          in_reply_to: string | null
          is_deleted: boolean | null
          message_id: string | null
          recipient: string
          sent_at: string
          subject: string | null
        }
        Insert: {
          attachments?: Json | null
          bcc?: string | null
          body_html?: string | null
          body_plain?: string | null
          cc?: string | null
          created_at?: string
          from_address: string
          id?: string
          in_reply_to?: string | null
          is_deleted?: boolean | null
          message_id?: string | null
          recipient: string
          sent_at?: string
          subject?: string | null
        }
        Update: {
          attachments?: Json | null
          bcc?: string | null
          body_html?: string | null
          body_plain?: string | null
          cc?: string | null
          created_at?: string
          from_address?: string
          id?: string
          in_reply_to?: string | null
          is_deleted?: boolean | null
          message_id?: string | null
          recipient?: string
          sent_at?: string
          subject?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_property_slug_db: {
        Args: {
          property_id: string
          property_location: string
          property_project_name: string
          property_rooms: number
          property_zone: string
        }
        Returns: string
      }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notify_google_sitemap:
        | { Args: never; Returns: undefined }
        | { Args: { target_urls?: Json }; Returns: undefined }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      slugify_text: { Args: { input_text: string }; Returns: string }
      trigger_scheduled_social_post: { Args: never; Returns: undefined }
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
