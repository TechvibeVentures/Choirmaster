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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      availability: {
        Row: {
          id: string
          person_id: string
          rehearsal_id: string
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
          updated_by_kind: Database["public"]["Enums"]["updated_by_kind"]
          updated_by_person_id: string | null
        }
        Insert: {
          id?: string
          person_id: string
          rehearsal_id: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
          updated_by_kind?: Database["public"]["Enums"]["updated_by_kind"]
          updated_by_person_id?: string | null
        }
        Update: {
          id?: string
          person_id?: string
          rehearsal_id?: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
          updated_by_kind?: Database["public"]["Enums"]["updated_by_kind"]
          updated_by_person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rehearsal_id_fkey"
            columns: ["rehearsal_id"]
            isOneToOne: false
            referencedRelation: "rehearsals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_updated_by_person_id_fkey"
            columns: ["updated_by_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      choir_memberships: {
        Row: {
          choir_id: string
          created_at: string
          id: string
          person_id: string
          roles: string[]
          singer_status: Database["public"]["Enums"]["singer_status"] | null
          voice: string | null
        }
        Insert: {
          choir_id: string
          created_at?: string
          id?: string
          person_id: string
          roles?: string[]
          singer_status?: Database["public"]["Enums"]["singer_status"] | null
          voice?: string | null
        }
        Update: {
          choir_id?: string
          created_at?: string
          id?: string
          person_id?: string
          roles?: string[]
          singer_status?: Database["public"]["Enums"]["singer_status"] | null
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "choir_memberships_choir_id_fkey"
            columns: ["choir_id"]
            isOneToOne: false
            referencedRelation: "choirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "choir_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      choirs: {
        Row: {
          city: string
          created_at: string
          default_location: string | null
          genres: string[] | null
          id: string
          name: string
          rehearsal_end_time: string
          rehearsal_start_time: string
          rehearsal_weekdays: string[]
          type: string | null
        }
        Insert: {
          city: string
          created_at?: string
          default_location?: string | null
          genres?: string[] | null
          id?: string
          name: string
          rehearsal_end_time: string
          rehearsal_start_time: string
          rehearsal_weekdays: string[]
          type?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          default_location?: string | null
          genres?: string[] | null
          id?: string
          name?: string
          rehearsal_end_time?: string
          rehearsal_start_time?: string
          rehearsal_weekdays?: string[]
          type?: string | null
        }
        Relationships: []
      }
      persons: {
        Row: {
          city: string | null
          created_at: string
          email: string
          experience_level: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          tags: string[] | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          experience_level?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          tags?: string[] | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          experience_level?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      project_access_tokens: {
        Row: {
          active: boolean
          created_at: string
          id: string
          project_id: string
          token: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          project_id: string
          token?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          project_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_participants: {
        Row: {
          created_at: string
          id: string
          invite_status: Database["public"]["Enums"]["invite_status"]
          person_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          person_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          person_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_participants_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          choir_id: string
          concerts: Json
          created_at: string
          date_range_end: string
          date_range_start: string
          description: string | null
          id: string
          link: string | null
          name: string
        }
        Insert: {
          choir_id: string
          concerts?: Json
          created_at?: string
          date_range_end: string
          date_range_start: string
          description?: string | null
          id?: string
          link?: string | null
          name: string
        }
        Update: {
          choir_id?: string
          concerts?: Json
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          description?: string | null
          id?: string
          link?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_choir_id_fkey"
            columns: ["choir_id"]
            isOneToOne: false
            referencedRelation: "choirs"
            referencedColumns: ["id"]
          },
        ]
      }
      rehearsals: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          location: string | null
          project_id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          location?: string | null
          project_id: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          location?: string | null
          project_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehearsals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_person_id: { Args: never; Returns: string }
      is_admin: { Args: { choir: string }; Returns: boolean }
      is_member: { Args: { choir: string }; Returns: boolean }
    }
    Enums: {
      availability_status: "yes" | "no" | "unknown"
      invite_status: "invited" | "confirmed" | "declined"
      singer_status: "active" | "inactive" | "project_only"
      updated_by_kind: "singer" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      availability_status: ["yes", "no", "unknown"],
      invite_status: ["invited", "confirmed", "declined"],
      singer_status: ["active", "inactive", "project_only"],
      updated_by_kind: ["singer", "admin"],
    },
  },
} as const
