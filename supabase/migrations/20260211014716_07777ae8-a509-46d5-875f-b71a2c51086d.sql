
-- Profiles table for artist info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  artist_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  starting_money BIGINT NOT NULL DEFAULT 10000,
  current_money BIGINT NOT NULL DEFAULT 10000,
  total_streams BIGINT NOT NULL DEFAULT 0,
  monthly_listeners BIGINT NOT NULL DEFAULT 0,
  spotify_followers BIGINT NOT NULL DEFAULT 0,
  apple_music_listeners BIGINT NOT NULL DEFAULT 0,
  youtube_subscribers BIGINT NOT NULL DEFAULT 0,
  x_followers BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Songs/tracks table
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  cover_url TEXT,
  streams BIGINT NOT NULL DEFAULT 0,
  release_turn INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view songs" ON public.songs FOR SELECT USING (true);
CREATE POLICY "Artists can insert own songs" ON public.songs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "Artists can update own songs" ON public.songs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = artist_id AND user_id = auth.uid())
);

-- Albums table
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  cover_url TEXT,
  album_type TEXT NOT NULL DEFAULT 'album',
  release_turn INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view albums" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Artists can insert own albums" ON public.albums FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = artist_id AND user_id = auth.uid())
);

-- Album songs junction
CREATE TABLE public.album_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  track_number INT NOT NULL DEFAULT 1
);

ALTER TABLE public.album_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view album_songs" ON public.album_songs FOR SELECT USING (true);
CREATE POLICY "Artists can manage album_songs" ON public.album_songs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.albums a JOIN public.profiles p ON a.artist_id = p.id WHERE a.id = album_id AND p.user_id = auth.uid())
);

-- Global game state (turn tracking)
CREATE TABLE public.game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_turn INT NOT NULL DEFAULT 0,
  turn_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  turn_duration_minutes INT NOT NULL DEFAULT 60
);

ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view game_state" ON public.game_state FOR SELECT USING (true);

-- Stream history per turn
CREATE TABLE public.stream_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  turn_number INT NOT NULL,
  streams_gained BIGINT NOT NULL DEFAULT 0,
  platform TEXT NOT NULL DEFAULT 'spotify',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stream_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stream_history" ON public.stream_history FOR SELECT USING (true);

-- Chart entries per turn
CREATE TABLE public.charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_number INT NOT NULL,
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  position INT NOT NULL,
  chart_type TEXT NOT NULL DEFAULT 'top_songs',
  streams BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view charts" ON public.charts FOR SELECT USING (true);

-- Enable realtime for multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.charts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;

-- Insert initial game state
INSERT INTO public.game_state (current_turn, turn_started_at, turn_duration_minutes) VALUES (1, now(), 60);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for artist images
INSERT INTO storage.buckets (id, name, public) VALUES ('artist-images', 'artist-images', true);

CREATE POLICY "Anyone can view artist images" ON storage.objects FOR SELECT USING (bucket_id = 'artist-images');
CREATE POLICY "Authenticated users can upload artist images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artist-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'artist-images' AND auth.uid() IS NOT NULL);
