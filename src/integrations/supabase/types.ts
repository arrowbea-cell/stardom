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
      album_songs: {
        Row: {
          album_id: string
          id: string
          song_id: string
          track_number: number
        }
        Insert: {
          album_id: string
          id?: string
          song_id: string
          track_number?: number
        }
        Update: {
          album_id?: string
          id?: string
          song_id?: string
          track_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "album_songs_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          album_type: string
          artist_id: string
          cover_url: string | null
          created_at: string
          id: string
          release_turn: number
          title: string
        }
        Insert: {
          album_type?: string
          artist_id: string
          cover_url?: string | null
          created_at?: string
          id?: string
          release_turn?: number
          title: string
        }
        Update: {
          album_type?: string
          artist_id?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          release_turn?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      charts: {
        Row: {
          artist_id: string
          chart_type: string
          created_at: string
          id: string
          position: number
          song_id: string | null
          streams: number
          turn_number: number
        }
        Insert: {
          artist_id: string
          chart_type?: string
          created_at?: string
          id?: string
          position: number
          song_id?: string | null
          streams?: number
          turn_number: number
        }
        Update: {
          artist_id?: string
          chart_type?: string
          created_at?: string
          id?: string
          position?: number
          song_id?: string | null
          streams?: number
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "charts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charts_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      game_state: {
        Row: {
          current_turn: number
          id: string
          turn_duration_minutes: number
          turn_started_at: string
        }
        Insert: {
          current_turn?: number
          id?: string
          turn_duration_minutes?: number
          turn_started_at?: string
        }
        Update: {
          current_turn?: number
          id?: string
          turn_duration_minutes?: number
          turn_started_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          boost_amount: number
          created_at: string
          id: string
          liked_artist_id: string
          liker_id: string
        }
        Insert: {
          boost_amount?: number
          created_at?: string
          id?: string
          liked_artist_id: string
          liker_id: string
        }
        Update: {
          boost_amount?: number
          created_at?: string
          id?: string
          liked_artist_id?: string
          liker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_liked_artist_id_fkey"
            columns: ["liked_artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          apple_music_listeners: number
          artist_name: string
          artist_pick: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_money: number
          genre: string | null
          has_home_studio: boolean | null
          home_studio_level: number | null
          id: string
          monthly_listeners: number
          spotify_followers: number
          starting_money: number
          total_streams: number
          updated_at: string
          user_id: string
          vault_songs: string[] | null
          x_followers: number
          youtube_subscribers: number
        }
        Insert: {
          age?: number | null
          apple_music_listeners?: number
          artist_name: string
          artist_pick?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_money?: number
          genre?: string | null
          has_home_studio?: boolean | null
          home_studio_level?: number | null
          id?: string
          monthly_listeners?: number
          spotify_followers?: number
          starting_money?: number
          total_streams?: number
          updated_at?: string
          user_id: string
          vault_songs?: string[] | null
          x_followers?: number
          youtube_subscribers?: number
        }
        Update: {
          age?: number | null
          apple_music_listeners?: number
          artist_name?: string
          artist_pick?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_money?: number
          genre?: string | null
          has_home_studio?: boolean | null
          home_studio_level?: number | null
          id?: string
          monthly_listeners?: number
          spotify_followers?: number
          starting_money?: number
          total_streams?: number
          updated_at?: string
          user_id?: string
          vault_songs?: string[] | null
          x_followers?: number
          youtube_subscribers?: number
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean | null
          artist_id: string
          boost_multiplier: number
          cost: number
          created_at: string
          id: string
          promotion_type: string
          song_id: string
        }
        Insert: {
          active?: boolean | null
          artist_id: string
          boost_multiplier?: number
          cost?: number
          created_at?: string
          id?: string
          promotion_type?: string
          song_id: string
        }
        Update: {
          active?: boolean | null
          artist_id?: string
          boost_multiplier?: number
          cost?: number
          created_at?: string
          id?: string
          promotion_type?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist_id: string
          cover_url: string | null
          created_at: string
          id: string
          release_turn: number
          streams: number
          title: string
        }
        Insert: {
          artist_id: string
          cover_url?: string | null
          created_at?: string
          id?: string
          release_turn?: number
          streams?: number
          title: string
        }
        Update: {
          artist_id?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          release_turn?: number
          streams?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_history: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          platform: string
          song_id: string
          streams_gained: number
          turn_number: number
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          platform?: string
          song_id: string
          streams_gained?: number
          turn_number: number
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          platform?: string
          song_id?: string
          streams_gained?: number
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "stream_history_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          cost_per_session: number
          description: string | null
          id: string
          image_emoji: string | null
          name: string
          quality_level: number
        }
        Insert: {
          cost_per_session?: number
          description?: string | null
          id?: string
          image_emoji?: string | null
          name: string
          quality_level?: number
        }
        Update: {
          cost_per_session?: number
          description?: string | null
          id?: string
          image_emoji?: string | null
          name?: string
          quality_level?: number
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
