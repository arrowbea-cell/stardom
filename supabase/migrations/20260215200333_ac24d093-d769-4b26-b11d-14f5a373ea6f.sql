
-- Collaborations: artists can send feature requests to each other
CREATE TABLE public.collaborations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  song_title TEXT NOT NULL,
  fee BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collaborations" ON public.collaborations FOR SELECT USING (true);
CREATE POLICY "Users can send collaborations" ON public.collaborations FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = collaborations.sender_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Receivers can update collaborations" ON public.collaborations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = collaborations.receiver_id AND profiles.user_id = auth.uid()));

-- Bank transactions
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  amount BIGINT NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.bank_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE (profiles.id = bank_transactions.sender_id OR profiles.id = bank_transactions.receiver_id) AND profiles.user_id = auth.uid()));
CREATE POLICY "Users can send money" ON public.bank_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = bank_transactions.sender_id AND profiles.user_id = auth.uid()));

-- Visas
CREATE TABLE public.visas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  country TEXT NOT NULL,
  visa_type TEXT NOT NULL DEFAULT 'tourist',
  cost BIGINT NOT NULL DEFAULT 500,
  obtained_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own visas" ON public.visas FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = visas.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Users can get visas" ON public.visas FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = visas.artist_id AND profiles.user_id = auth.uid()));

-- Travel / stays
CREATE TABLE public.travels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  apartment_name TEXT NOT NULL,
  apartment_tier TEXT NOT NULL DEFAULT 'budget',
  daily_rent BIGINT NOT NULL DEFAULT 100,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_days INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own travels" ON public.travels FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = travels.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Users can book travels" ON public.travels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = travels.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Users can update own travels" ON public.travels FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = travels.artist_id AND profiles.user_id = auth.uid()));

-- Lifestyle items catalog
CREATE TABLE public.lifestyle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  price BIGINT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✨',
  rarity TEXT NOT NULL DEFAULT 'common'
);
ALTER TABLE public.lifestyle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lifestyle items" ON public.lifestyle_items FOR SELECT USING (true);

-- Artist purchased items
CREATE TABLE public.artist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.profiles(id),
  item_id UUID NOT NULL REFERENCES public.lifestyle_items(id),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.artist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own items" ON public.artist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = artist_items.artist_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Users can buy items" ON public.artist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = artist_items.artist_id AND profiles.user_id = auth.uid()));

-- Add location tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_country TEXT DEFAULT 'United States';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_country TEXT DEFAULT 'United States';

-- Seed lifestyle items
INSERT INTO public.lifestyle_items (name, category, brand, price, emoji, rarity) VALUES
-- Cars
('Honda Civic', 'cars', 'Honda', 25000, '🚗', 'common'),
('BMW M4', 'cars', 'BMW', 75000, '🏎️', 'rare'),
('Mercedes AMG GT', 'cars', 'Mercedes', 150000, '🏎️', 'rare'),
('Lamborghini Urus', 'cars', 'Lamborghini', 250000, '🏎️', 'epic'),
('Rolls Royce Phantom', 'cars', 'Rolls Royce', 450000, '🏎️', 'legendary'),
('Bugatti Chiron', 'cars', 'Bugatti', 3000000, '🏎️', 'legendary'),
-- Clothes
('Street Hoodie', 'clothes', 'Essentials', 500, '👕', 'common'),
('Designer Jacket', 'clothes', 'Balenciaga', 3500, '🧥', 'rare'),
('Custom Leather Jacket', 'clothes', 'Chrome Hearts', 8000, '🧥', 'epic'),
('Fur Coat', 'clothes', 'Moncler', 15000, '🧥', 'epic'),
-- Bags
('Crossbody Bag', 'bags', 'Louis Vuitton', 2500, '👜', 'rare'),
('Duffle Bag', 'bags', 'Goyard', 5000, '👜', 'rare'),
('Birkin Bag', 'bags', 'Hermès', 25000, '👜', 'legendary'),
-- Watches
('G-Shock', 'watches', 'Casio', 150, '⌚', 'common'),
('Submariner', 'watches', 'Rolex', 15000, '⌚', 'epic'),
('Royal Oak', 'watches', 'Audemars Piguet', 45000, '⌚', 'epic'),
('Nautilus', 'watches', 'Patek Philippe', 130000, '⌚', 'legendary'),
-- Chains
('Silver Chain', 'chains', 'Generic', 500, '📿', 'common'),
('Gold Cuban Link', 'chains', 'Custom', 5000, '📿', 'rare'),
('Diamond Cuban Link', 'chains', 'Custom', 25000, '📿', 'epic'),
('Iced Out Pendant', 'chains', 'Jacob & Co', 75000, '📿', 'epic'),
('Diamond Encrusted Chain', 'chains', 'Elliot Eliantte', 250000, '📿', 'legendary'),
-- Shoes
('Air Force 1s', 'shoes', 'Nike', 120, '👟', 'common'),
('Jordan 1 Retro', 'shoes', 'Nike', 350, '👟', 'common'),
('Yeezy 350', 'shoes', 'Adidas', 500, '👟', 'rare'),
('Triple S', 'shoes', 'Balenciaga', 1200, '👟', 'rare'),
('Red Bottoms', 'shoes', 'Louboutin', 3000, '👟', 'epic');
