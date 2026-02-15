import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/supabase-helpers';
import { ShoppingBag, Car, Watch, Gem, Shirt, Footprints, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props { profile: Profile; }

const CATEGORY_ICONS: Record<string, any> = {
  cars: Car, watches: Watch, chains: Gem, clothes: Shirt, bags: ShoppingBag, shoes: Footprints,
};

const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
};

const RARITY_BG: Record<string, string> = {
  common: 'from-secondary/80 to-secondary/40',
  rare: 'from-blue-950/40 to-blue-900/20',
  epic: 'from-purple-950/40 to-purple-900/20',
  legendary: 'from-amber-950/40 to-amber-900/20',
};

const RARITY_BORDER: Record<string, string> = {
  common: 'border-border/50',
  rare: 'border-blue-500/20',
  epic: 'border-purple-500/20',
  legendary: 'border-amber-500/30',
};

// Map items to curated image URLs (unsplash)
const ITEM_IMAGES: Record<string, string> = {
  'Honda Civic': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=200&fit=crop',
  'BMW M4': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=200&fit=crop',
  'Mercedes AMG GT': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&h=200&fit=crop',
  'Lamborghini Urus': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=200&fit=crop',
  'Rolls Royce Phantom': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=200&h=200&fit=crop',
  'Bugatti Chiron': 'https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=200&h=200&fit=crop',
  'Street Hoodie': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop',
  'Designer Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop',
  'Custom Leather Jacket': 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=200&h=200&fit=crop',
  'Fur Coat': 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=200&h=200&fit=crop',
  'Crossbody Bag': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop',
  'Duffle Bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop',
  'Birkin Bag': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop',
  'G-Shock': 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200&h=200&fit=crop',
  'Submariner': 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=200&h=200&fit=crop',
  'Royal Oak': 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=200&h=200&fit=crop',
  'Nautilus': 'https://images.unsplash.com/photo-1639037687665-4f68a6a30269?w=200&h=200&fit=crop',
  'Silver Chain': 'https://images.unsplash.com/photo-1515562141589-67f0d569b5e2?w=200&h=200&fit=crop',
  'Gold Cuban Link': 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=200&h=200&fit=crop',
  'Diamond Cuban Link': 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=200&h=200&fit=crop',
  'Iced Out Pendant': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&h=200&fit=crop',
  'Diamond Encrusted Chain': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=200&h=200&fit=crop',
  'Air Force 1s': 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=200&h=200&fit=crop',
  'Jordan 1 Retro': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=200&h=200&fit=crop',
  'Yeezy 350': 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=200&h=200&fit=crop',
  'Triple S': 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=200&h=200&fit=crop',
  'Red Bottoms': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&h=200&fit=crop',
};

const CATEGORIES = ['all', 'cars', 'watches', 'chains', 'clothes', 'bags', 'shoes'];

export default function LifestyleTab({ profile }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [category, setCategory] = useState('all');
  const [tab, setTab] = useState<'shop' | 'closet'>('shop');

  useEffect(() => {
    supabase.from('lifestyle_items').select('*').order('price', { ascending: true })
      .then(({ data }) => { if (data) setItems(data); });
    loadOwned();
  }, [profile.id]);

  const loadOwned = async () => {
    const { data } = await supabase.from('artist_items').select('item_id').eq('artist_id', profile.id);
    if (data) setOwned(data.map(d => d.item_id));
  };

  const buyItem = async (item: any) => {
    if (owned.includes(item.id)) { toast.info('Already owned'); return; }
    if (item.price > profile.current_money) { toast.error('Not enough money'); return; }

    await supabase.from('profiles').update({ current_money: profile.current_money - item.price }).eq('id', profile.id);
    await supabase.from('artist_items').insert({ artist_id: profile.id, item_id: item.id });
    setOwned([...owned, item.id]);
    toast.success(`Bought ${item.name}! 🛍️`);
  };

  const filtered = items.filter(i => category === 'all' || i.category === category);
  const ownedItems = items.filter(i => owned.includes(i.id));

  const renderItem = (item: any, i: number, showBuy: boolean) => {
    const isOwned = owned.includes(item.id);
    const imgUrl = ITEM_IMAGES[item.name];

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.02 }}
        className={`rounded-xl border overflow-hidden bg-gradient-to-br ${RARITY_BG[item.rarity]} ${RARITY_BORDER[item.rarity]} ${isOwned && showBuy ? 'opacity-60' : ''}`}
      >
        {/* Image */}
        <div className="aspect-square w-full bg-secondary/30 relative overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">{item.emoji}</div>
          )}
          {/* Rarity badge */}
          <span className={`absolute top-2 left-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-background/80 backdrop-blur-sm ${RARITY_COLORS[item.rarity]}`}>
            {item.rarity}
          </span>
          {isOwned && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-2.5">
          <p className="text-xs font-semibold truncate">{item.name}</p>
          <p className="text-[10px] text-muted-foreground">{item.brand}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-mono font-bold text-primary">{formatMoney(item.price)}</span>
            {showBuy && !isOwned && (
              <Button size="sm" onClick={() => buyItem(item)} className="text-[10px] h-6 px-2 rounded-md">
                Buy
              </Button>
            )}
            {isOwned && showBuy && <span className="text-[10px] text-primary">Owned</span>}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full pb-4">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Lifestyle</h2>
        </div>
        <p className="text-xs text-muted-foreground">Balance: {formatMoney(profile.current_money)} • {owned.length} items owned</p>
      </div>

      <div className="flex border-b border-border">
        {(['shop', 'closet'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize ${tab === t ? 'tab-active' : 'tab-inactive'}`}>
            {t === 'closet' ? `Collection (${owned.length})` : '🛒 Shop'}
          </button>
        ))}
      </div>

      {tab === 'shop' && (
        <div className="flex gap-1.5 overflow-x-auto p-3 pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${
                category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>{c}</button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto px-3 pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          {tab === 'shop'
            ? filtered.map((item, i) => renderItem(item, i, true))
            : ownedItems.length > 0
              ? ownedItems.map((item, i) => renderItem(item, i, false))
              : null
          }
        </div>
        {tab === 'closet' && ownedItems.length === 0 && (
          <div className="text-center py-8">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No items yet — hit the shop!</p>
          </div>
        )}
      </div>
    </div>
  );
}
