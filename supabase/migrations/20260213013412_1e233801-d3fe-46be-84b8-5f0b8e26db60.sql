
-- Post likes table for X app boost system
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID NOT NULL REFERENCES public.profiles(id),
  liked_artist_id UUID NOT NULL REFERENCES public.profiles(id),
  boost_amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post_likes" ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.post_likes FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = post_likes.liker_id AND profiles.user_id = auth.uid()));

-- Add artist_pick column to profiles for Spotify artist pick feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS artist_pick TEXT DEFAULT '';

-- Enable realtime for post_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
