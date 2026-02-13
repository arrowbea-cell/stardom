
-- Add genre, age, and home studio fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS genre TEXT DEFAULT 'Pop';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 21;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_home_studio BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_studio_level INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vault_songs TEXT[] DEFAULT '{}';

-- Studios table
CREATE TABLE public.studios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  quality_level INTEGER NOT NULL DEFAULT 1,
  cost_per_session BIGINT NOT NULL DEFAULT 500,
  image_emoji TEXT DEFAULT '🎵'
);

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view studios" ON public.studios FOR SELECT USING (true);

-- Insert some default studios
INSERT INTO public.studios (name, description, quality_level, cost_per_session, image_emoji) VALUES
  ('Bedroom Studio', 'A basic setup with a laptop and headphones. Low quality but free.', 1, 0, '🏠'),
  ('Local Studio', 'A small neighborhood recording studio. Decent quality.', 2, 500, '🎤'),
  ('City Studio', 'Professional city recording studio with good equipment.', 3, 2000, '🏙️'),
  ('Hit Factory', 'High-end studio where hits are made. Top tier equipment.', 4, 5000, '🔥'),
  ('Platinum Records', 'World-class studio with legendary producers. The best of the best.', 5, 15000, '💎');

-- Promotions table for tracking active promotions on songs
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID NOT NULL REFERENCES public.songs(id),
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  promotion_type TEXT NOT NULL DEFAULT 'basic',
  cost BIGINT NOT NULL DEFAULT 0,
  boost_multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view promotions" ON public.promotions FOR SELECT USING (true);

CREATE POLICY "Artists can create own promotions" ON public.promotions FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = promotions.artist_id AND profiles.user_id = auth.uid()));

CREATE POLICY "Artists can update own promotions" ON public.promotions FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = promotions.artist_id AND profiles.user_id = auth.uid()));
