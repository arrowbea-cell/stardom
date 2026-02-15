import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/supabase-helpers';
import { ShoppingBag, Car, Watch, Gem, Shirt, Footprints, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props { profile: Profile; }

const CATEGORY_ICONS: Record<string, any> = {
  cars: Car, watches: Watch, chains: Gem, clothes: Shirt, bags: ShoppingBag, shoes: Footprints,
};

const RARITY_COLORS: Record<string, string> = {
  common: 'text-muted-foreground border-border',
  rare: 'text-blue-400 border-blue-400/30',
  epic: 'text-purple-400 border-purple-400/30',
  legendary: 'text-amber-400 border-amber-400/30',
};

const RARITY_BG: Record<string, string> = {
  common: 'bg-secondary/50',
  rare: 'bg-blue-400/5',
  epic: 'bg-purple-400/5',
  legendary: 'bg-amber-400/5',
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

  return (
    <div className="flex flex-col h-full">
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
            {t === 'closet' ? `My Collection (${owned.length})` : '🛒 Shop'}
          </button>
        ))}
      </div>

      {tab === 'shop' && (
        <div className="flex gap-1.5 overflow-x-auto p-3 pb-0">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${
                category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>{c}</button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {tab === 'shop' ? (
          filtered.map((item, i) => {
            const isOwned = owned.includes(item.id);
            const Icon = CATEGORY_ICONS[item.category] || ShoppingBag;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`glass-card p-3 flex items-center gap-3 ${RARITY_BG[item.rarity]} ${isOwned ? 'opacity-60' : ''}`}
              >
                <span className="text-2xl w-8 text-center">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.brand}</span>
                    <span className={`text-[10px] uppercase font-bold ${RARITY_COLORS[item.rarity]}`}>{item.rarity}</span>
                  </div>
                </div>
                {isOwned ? (
                  <span className="text-xs text-primary font-medium">Owned ✓</span>
                ) : (
                  <Button size="sm" onClick={() => buyItem(item)} className="text-xs h-8">
                    {formatMoney(item.price)}
                  </Button>
                )}
              </motion.div>
            );
          })
        ) : (
          ownedItems.length > 0 ? ownedItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card p-3 flex items-center gap-3 ${RARITY_BG[item.rarity]}`}
            >
              <span className="text-2xl w-8 text-center">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.brand}</span>
                  <span className={`text-[10px] uppercase font-bold ${RARITY_COLORS[item.rarity]}`}>{item.rarity}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{formatMoney(item.price)}</span>
            </motion.div>
          )) : (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No items yet — hit the shop!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
