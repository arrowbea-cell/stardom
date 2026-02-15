import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  bio: string;
  starting_money: number;
  current_money: number;
  total_streams: number;
  monthly_listeners: number;
  spotify_followers: number;
  apple_music_listeners: number;
  youtube_subscribers: number;
  x_followers: number;
  created_at: string;
  updated_at: string;
  genre?: string;
  age?: number;
  has_home_studio?: boolean;
  home_studio_level?: number;
  artist_pick?: string;
  vault_songs?: string[];
  current_country?: string;
  home_country?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    };

    fetchProfile();

    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new) setProfile(payload.new as Profile);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { profile, loading };
}
