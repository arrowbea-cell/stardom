import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { ShoppingBag, Plus, TrendingUp, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

interface MerchItem {
  id: string;
  name: string;
  category: string;
  price: number;
  sales: number;
  emoji: string;
  created_at: string;
}

const MERCH_TEMPLATES = [
  { category: 'tshirt', emoji: '👕', nameTemplates: ['Classic Tee', 'Tour Tee', 'Logo Tee', 'Vintage Tee'], baseCost: 500, basePrice: 35 },
  { category: 'hoodie', emoji: '🧥', nameTemplates: ['Logo Hoodie', 'Tour Hoodie', 'Oversized Hoodie'], baseCost: 800, basePrice: 65 },
  { category: 'hat', emoji: '🧢', nameTemplates: ['Snapback', 'Dad Hat', 'Beanie'], baseCost: 300, basePrice: 30 },
  { category: 'poster', emoji: '🖼️', nameTemplates: ['Album Poster', 'Tour Poster', 'Signed Poster'], baseCost: 200, basePrice: 20 },
  { category: 'vinyl', emoji: '💿', nameTemplates: ['Limited Vinyl', 'Deluxe Vinyl', 'Signed Vinyl'], baseCost: 1000, basePrice: 45 },
  { category: 'bundle', emoji: '📦', nameTemplates: ['Fan Bundle', 'VIP Bundle', 'Deluxe Bundle'], baseCost: 2000, basePrice: 120 },
];

export default function MerchApp({ profile }: Props) {
  const { user } = useAuth();
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [tab, setTab] = useState<'store' | 'create'>('store');
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customName, setCustomName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.from('merch_items').select('*').eq('artist_id', profile.id).order('sales', { ascending: false })
      .then(({ data }) => { if (data) setMerch(data as MerchItem[]); });
  }, [profile.id]);

  const handleCreate = async () => {
    if (!user) return;
    const template = MERCH_TEMPLATES[selectedTemplate];
    const name = customName.trim() || template.nameTemplates[Math.floor(Math.random() * template.nameTemplates.length)];

    if (profile.current_money < template.baseCost) {
      toast.error("Can't afford to produce this merch!");
      return;
    }

    setCreating(true);
    await new Promise(r => setTimeout(r, 1500));

    const { error } = await supabase.from('merch_items').insert({
      artist_id: profile.id,
      name,
      category: template.category,
      price: template.basePrice,
      emoji: template.emoji,
    });

    if (error) { toast.error(error.message); setCreating(false); return; }

    await supabase.from('profiles').update({
      current_money: profile.current_money - template.baseCost,
    }).eq('id', profile.id);

    toast.success(`"${name}" merch created! 🛍️`);
    setCreating(false);
    setCustomName('');

    const { data: newMerch } = await supabase.from('merch_items').select('*').eq('artist_id', profile.id).order('sales', { ascending: false });
    if (newMerch) setMerch(newMerch as MerchItem[]);
  };

  const totalRevenue = merch.reduce((sum, m) => sum + (m.sales * m.price), 0);
  const totalSales = merch.reduce((sum, m) => sum + m.sales, 0);

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#ec4899]/20 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#be185d] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Merch Store</h1>
            <p className="text-xs text-white/60">{merch.length} products • {formatNumber(totalSales)} sold • {formatMoney(totalRevenue)} revenue</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#222] mx-4">
        <button onClick={() => setTab('store')} className={`flex-1 py-3 text-sm font-medium ${tab === 'store' ? 'text-white border-b-2 border-[#ec4899]' : 'text-[#888]'}`}>
          My Merch ({merch.length})
        </button>
        <button onClick={() => setTab('create')} className={`flex-1 py-3 text-sm font-medium ${tab === 'create' ? 'text-white border-b-2 border-[#ec4899]' : 'text-[#888]'}`}>
          Create New
        </button>
      </div>

      {tab === 'store' && (
        <div className="px-4 py-4">
          {/* Revenue cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#1a1a1a] rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[#888] text-xs mb-1">
                <DollarSign className="w-3 h-3" /> Revenue
              </div>
              <p className="font-bold text-lg">{formatMoney(totalRevenue)}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[#888] text-xs mb-1">
                <Package className="w-3 h-3" /> Units Sold
              </div>
              <p className="font-bold text-lg">{formatNumber(totalSales)}</p>
            </div>
          </div>

          {merch.length > 0 ? (
            <div className="space-y-2">
              {merch.map((item) => (
                <div key={item.id} className="bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#282828] flex items-center justify-center text-2xl">{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{item.name}</p>
                    <p className="text-xs text-[#888]">${item.price} • {formatNumber(item.sales)} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#ec4899]">{formatMoney(item.sales * item.price)}</p>
                    <p className="text-[10px] text-[#888]">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#888]">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No merch yet</p>
              <p className="text-xs mt-1">Create merch to earn passive income from fans!</p>
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="px-4 py-4 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Choose Merch Type</h3>
            <div className="grid grid-cols-3 gap-2">
              {MERCH_TEMPLATES.map((t, i) => (
                <button
                  key={t.category}
                  onClick={() => setSelectedTemplate(i)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${
                    selectedTemplate === i ? 'bg-[#ec4899]/20 ring-1 ring-[#ec4899]' : 'bg-[#1a1a1a]'
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-xs font-medium capitalize">{t.category}</span>
                  <span className="text-[10px] text-[#888]">{formatMoney(t.baseCost)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Custom Name (optional)</h3>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={MERCH_TEMPLATES[selectedTemplate].nameTemplates[0]}
              className="w-full bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-[#ec4899]"
            />
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Production cost</span>
              <span>{formatMoney(MERCH_TEMPLATES[selectedTemplate].baseCost)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#888]">Retail price</span>
              <span className="text-[#ec4899]">${MERCH_TEMPLATES[selectedTemplate].basePrice}/unit</span>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-gradient-to-r from-[#ec4899] to-[#be185d] rounded-xl py-4 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
            ) : (
              <><Plus className="w-5 h-5" /> Create Merch ({formatMoney(MERCH_TEMPLATES[selectedTemplate].baseCost)})</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
