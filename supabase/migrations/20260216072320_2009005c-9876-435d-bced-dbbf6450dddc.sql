
-- Concerts/Tours system
CREATE TABLE public.concerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_capacity INTEGER NOT NULL DEFAULT 500,
  ticket_price INTEGER NOT NULL DEFAULT 50,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  revenue INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view concerts" ON public.concerts FOR SELECT USING (true);
CREATE POLICY "Artists can create own concerts" ON public.concerts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = concerts.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Artists can update own concerts" ON public.concerts FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = concerts.artist_id AND profiles.user_id = auth.uid()));

-- Record Deals/Label system
CREATE TABLE public.record_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  label_name TEXT NOT NULL,
  deal_type TEXT NOT NULL DEFAULT 'standard',
  advance_amount INTEGER NOT NULL DEFAULT 0,
  royalty_rate NUMERIC NOT NULL DEFAULT 0.15,
  duration_turns INTEGER NOT NULL DEFAULT 10,
  turns_remaining INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.record_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view record deals" ON public.record_deals FOR SELECT USING (true);
CREATE POLICY "Artists can sign deals" ON public.record_deals FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = record_deals.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Artists can update own deals" ON public.record_deals FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = record_deals.artist_id AND profiles.user_id = auth.uid()));

-- Beefs/Drama system
CREATE TABLE public.beefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_id UUID NOT NULL REFERENCES public.profiles(id),
  target_id UUID NOT NULL REFERENCES public.profiles(id),
  diss_track_title TEXT,
  intensity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  clout_gained INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.beefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view beefs" ON public.beefs FOR SELECT USING (true);
CREATE POLICY "Artists can start beefs" ON public.beefs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = beefs.initiator_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Participants can update beefs" ON public.beefs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = beefs.initiator_id AND profiles.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = beefs.target_id AND profiles.user_id = auth.uid())
);
