
-- Create pitchfork reviews table
CREATE TABLE public.pitchfork_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  score NUMERIC(3,1) NOT NULL DEFAULT 0,
  review_text TEXT NOT NULL,
  reviewer_name TEXT NOT NULL DEFAULT 'Staff',
  turn_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pitchfork_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pitchfork reviews" ON public.pitchfork_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert pitchfork reviews" ON public.pitchfork_reviews FOR INSERT WITH CHECK (true);
