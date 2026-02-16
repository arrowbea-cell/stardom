
-- Music Videos table
CREATE TABLE public.music_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  song_id UUID NOT NULL REFERENCES public.songs(id),
  budget TEXT NOT NULL DEFAULT 'low',
  views BIGINT NOT NULL DEFAULT 0,
  youtube_boost BIGINT NOT NULL DEFAULT 0,
  cost BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.music_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view music_videos" ON public.music_videos FOR SELECT USING (true);
CREATE POLICY "Artists can create own music_videos" ON public.music_videos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = music_videos.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Artists can update own music_videos" ON public.music_videos FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = music_videos.artist_id AND profiles.user_id = auth.uid()));

-- Awards table
CREATE TABLE public.awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  award_name TEXT NOT NULL,
  category TEXT NOT NULL,
  turn_number INTEGER NOT NULL DEFAULT 0,
  won BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view awards" ON public.awards FOR SELECT USING (true);

-- Merch designs table
CREATE TABLE public.merch_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tshirt',
  price BIGINT NOT NULL DEFAULT 25,
  sales BIGINT NOT NULL DEFAULT 0,
  emoji TEXT NOT NULL DEFAULT '👕',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.merch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view merch" ON public.merch_items FOR SELECT USING (true);
CREATE POLICY "Artists can create own merch" ON public.merch_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = merch_items.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Artists can update own merch" ON public.merch_items FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = merch_items.artist_id AND profiles.user_id = auth.uid()));

-- Fan mail table
CREATE TABLE public.fan_mail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  fan_name TEXT NOT NULL,
  message TEXT NOT NULL,
  responded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fan_mail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists can view own fan_mail" ON public.fan_mail FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = fan_mail.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Artists can update own fan_mail" ON public.fan_mail FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = fan_mail.artist_id AND profiles.user_id = auth.uid()));
