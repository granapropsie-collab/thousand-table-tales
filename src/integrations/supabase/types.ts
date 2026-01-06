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
  public: {
    Tables: {
      current_trick: {
        Row: {
          card: Json
          id: string
          played_at: string
          player_id: string
          position: number
          room_id: string
        }
        Insert: {
          card: Json
          id?: string
          played_at?: string
          player_id: string
          position: number
          room_id: string
        }
        Update: {
          card?: Json
          id?: string
          played_at?: string
          player_id?: string
          position?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_trick_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      last_winners: {
        Row: {
          id: string
          rounds: number
          score: string
          team_name: string
          won_at: string
        }
        Insert: {
          id?: string
          rounds?: number
          score: string
          team_name: string
          won_at?: string
        }
        Update: {
          id?: string
          rounds?: number
          score?: string
          team_name?: string
          won_at?: string
        }
        Relationships: []
      }
      musik: {
        Row: {
          cards: Json
          id: string
          revealed: boolean
          room_id: string
        }
        Insert: {
          cards?: Json
          id?: string
          revealed?: boolean
          room_id: string
        }
        Update: {
          cards?: Json
          id?: string
          revealed?: boolean
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "musik_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_players: {
        Row: {
          cards: Json
          id: string
          is_host: boolean
          is_ready: boolean
          joined_at: string
          melds: Json
          nickname: string
          player_id: string
          position: number | null
          room_id: string
          round_score: number
          team: string | null
          tricks_won: Json
        }
        Insert: {
          cards?: Json
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string
          melds?: Json
          nickname: string
          player_id: string
          position?: number | null
          room_id: string
          round_score?: number
          team?: string | null
          tricks_won?: Json
        }
        Update: {
          cards?: Json
          id?: string
          is_host?: boolean
          is_ready?: boolean
          joined_at?: string
          melds?: Json
          nickname?: string
          player_id?: string
          position?: number | null
          room_id?: string
          round_score?: number
          team?: string | null
          tricks_won?: Json
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          bid_winner_id: string | null
          code: string
          created_at: string
          current_bid: number | null
          current_player_id: string | null
          current_trump: string | null
          game_mode: string
          host_id: string | null
          id: string
          max_players: number
          name: string
          phase: string
          round_number: number
          status: string
          team_a_name: string
          team_a_score: number
          team_b_name: string
          team_b_score: number
          updated_at: string
          with_musik: boolean
        }
        Insert: {
          bid_winner_id?: string | null
          code?: string
          created_at?: string
          current_bid?: number | null
          current_player_id?: string | null
          current_trump?: string | null
          game_mode?: string
          host_id?: string | null
          id?: string
          max_players?: number
          name: string
          phase?: string
          round_number?: number
          status?: string
          team_a_name?: string
          team_a_score?: number
          team_b_name?: string
          team_b_score?: number
          updated_at?: string
          with_musik?: boolean
        }
        Update: {
          bid_winner_id?: string | null
          code?: string
          created_at?: string
          current_bid?: number | null
          current_player_id?: string | null
          current_trump?: string | null
          game_mode?: string
          host_id?: string | null
          id?: string
          max_players?: number
          name?: string
          phase?: string
          round_number?: number
          status?: string
          team_a_name?: string
          team_a_score?: number
          team_b_name?: string
          team_b_score?: number
          updated_at?: string
          with_musik?: boolean
        }
        Relationships: []
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
