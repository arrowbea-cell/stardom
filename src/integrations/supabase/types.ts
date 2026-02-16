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
      artist_items: {
        Row: {
          artist_id: string
          id: string
          item_id: string
          purchased_at: string
        }
        Insert: {
          artist_id: string
          id?: string
          item_id: string
          purchased_at?: string
        }
        Update: {
          artist_id?: string
          id?: string
          item_id?: string
          purchased_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "lifestyle_items"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          artist_id: string
          award_name: string
          category: string
          created_at: string
          id: string
          turn_number: number
          won: boolean
        }
        Insert: {
          artist_id: string
          award_name: string
          category: string
          created_at?: string
          id?: string
          turn_number?: number
          won?: boolean
        }
        Update: {
          artist_id?: string
          award_name?: string
          category?: string
          created_at?: string
          id?: string
          turn_number?: number
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "awards_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beefs: {
        Row: {
          clout_gained: number
          created_at: string
          diss_track_title: string | null
          id: string
          initiator_id: string
          intensity: number
          status: string
          target_id: string
        }
        Insert: {
          clout_gained?: number
          created_at?: string
          diss_track_title?: string | null
          id?: string
          initiator_id: string
          intensity?: number
          status?: string
          target_id: string
        }
        Update: {
          clout_gained?: number
          created_at?: string
          diss_track_title?: string | null
          id?: string
          initiator_id?: string
          intensity?: number
          status?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beefs_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beefs_target_id_fkey"
            columns: ["target_id"]
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
      collaborations: {
        Row: {
          created_at: string
          fee: number
          id: string
          receiver_id: string
          sender_id: string
          song_title: string
          status: string
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          receiver_id: string
          sender_id: string
          song_title: string
          status?: string
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          receiver_id?: string
          sender_id?: string
          song_title?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      concerts: {
        Row: {
          artist_id: string
          city: string
          country: string
          created_at: string
          id: string
          revenue: number
          status: string
          ticket_price: number
          tickets_sold: number
          venue_capacity: number
          venue_name: string
        }
        Insert: {
          artist_id: string
          city: string
          country: string
          created_at?: string
          id?: string
          revenue?: number
          status?: string
          ticket_price?: number
          tickets_sold?: number
          venue_capacity?: number
          venue_name: string
        }
        Update: {
          artist_id?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          revenue?: number
          status?: string
          ticket_price?: number
          tickets_sold?: number
          venue_capacity?: number
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "concerts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_mail: {
        Row: {
          artist_id: string
          created_at: string
          fan_name: string
          id: string
          message: string
          responded: boolean
        }
        Insert: {
          artist_id: string
          created_at?: string
          fan_name: string
          id?: string
          message: string
          responded?: boolean
        }
        Update: {
          artist_id?: string
          created_at?: string
          fan_name?: string
          id?: string
          message?: string
          responded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fan_mail_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      lifestyle_items: {
        Row: {
          brand: string
          category: string
          emoji: string
          id: string
          name: string
          price: number
          rarity: string
        }
        Insert: {
          brand?: string
          category: string
          emoji?: string
          id?: string
          name: string
          price: number
          rarity?: string
        }
        Update: {
          brand?: string
          category?: string
          emoji?: string
          id?: string
          name?: string
          price?: number
          rarity?: string
        }
        Relationships: []
      }
      merch_items: {
        Row: {
          artist_id: string
          category: string
          created_at: string
          emoji: string
          id: string
          name: string
          price: number
          sales: number
        }
        Insert: {
          artist_id: string
          category?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
          price?: number
          sales?: number
        }
        Update: {
          artist_id?: string
          category?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          price?: number
          sales?: number
        }
        Relationships: [
          {
            foreignKeyName: "merch_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      music_videos: {
        Row: {
          artist_id: string
          budget: string
          cost: number
          created_at: string
          id: string
          song_id: string
          views: number
          youtube_boost: number
        }
        Insert: {
          artist_id: string
          budget?: string
          cost?: number
          created_at?: string
          id?: string
          song_id: string
          views?: number
          youtube_boost?: number
        }
        Update: {
          artist_id?: string
          budget?: string
          cost?: number
          created_at?: string
          id?: string
          song_id?: string
          views?: number
          youtube_boost?: number
        }
        Relationships: [
          {
            foreignKeyName: "music_videos_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "music_videos_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      pitchfork_reviews: {
        Row: {
          album_id: string | null
          artist_id: string
          created_at: string
          id: string
          review_text: string
          reviewer_name: string
          score: number
          song_id: string | null
          turn_number: number
        }
        Insert: {
          album_id?: string | null
          artist_id: string
          created_at?: string
          id?: string
          review_text: string
          reviewer_name?: string
          score?: number
          song_id?: string | null
          turn_number?: number
        }
        Update: {
          album_id?: string | null
          artist_id?: string
          created_at?: string
          id?: string
          review_text?: string
          reviewer_name?: string
          score?: number
          song_id?: string | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "pitchfork_reviews_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitchfork_reviews_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitchfork_reviews_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
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
          current_country: string | null
          current_money: number
          genre: string | null
          has_home_studio: boolean | null
          home_country: string | null
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
          current_country?: string | null
          current_money?: number
          genre?: string | null
          has_home_studio?: boolean | null
          home_country?: string | null
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
          current_country?: string | null
          current_money?: number
          genre?: string | null
          has_home_studio?: boolean | null
          home_country?: string | null
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
      record_deals: {
        Row: {
          active: boolean
          advance_amount: number
          artist_id: string
          deal_type: string
          duration_turns: number
          id: string
          label_name: string
          royalty_rate: number
          signed_at: string
          turns_remaining: number
        }
        Insert: {
          active?: boolean
          advance_amount?: number
          artist_id: string
          deal_type?: string
          duration_turns?: number
          id?: string
          label_name: string
          royalty_rate?: number
          signed_at?: string
          turns_remaining?: number
        }
        Update: {
          active?: boolean
          advance_amount?: number
          artist_id?: string
          deal_type?: string
          duration_turns?: number
          id?: string
          label_name?: string
          royalty_rate?: number
          signed_at?: string
          turns_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "record_deals_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          radio_spins: number
          release_turn: number
          streams: number
          title: string
        }
        Insert: {
          artist_id: string
          cover_url?: string | null
          created_at?: string
          id?: string
          radio_spins?: number
          release_turn?: number
          streams?: number
          title: string
        }
        Update: {
          artist_id?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          radio_spins?: number
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
      travels: {
        Row: {
          active: boolean
          apartment_name: string
          apartment_tier: string
          artist_id: string
          check_in: string
          city: string
          country: string
          created_at: string
          daily_rent: number
          duration_days: number
          id: string
        }
        Insert: {
          active?: boolean
          apartment_name: string
          apartment_tier?: string
          artist_id: string
          check_in?: string
          city: string
          country: string
          created_at?: string
          daily_rent?: number
          duration_days?: number
          id?: string
        }
        Update: {
          active?: boolean
          apartment_name?: string
          apartment_tier?: string
          artist_id?: string
          check_in?: string
          city?: string
          country?: string
          created_at?: string
          daily_rent?: number
          duration_days?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travels_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visas: {
        Row: {
          artist_id: string
          cost: number
          country: string
          id: string
          obtained_at: string
          visa_type: string
        }
        Insert: {
          artist_id: string
          cost?: number
          country: string
          id?: string
          obtained_at?: string
          visa_type?: string
        }
        Update: {
          artist_id?: string
          cost?: number
          country?: string
          id?: string
          obtained_at?: string
          visa_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visas_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
