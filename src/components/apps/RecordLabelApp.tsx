import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Building2, FileSignature, DollarSign, TrendingUp, Star, Shield, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

const LABELS = [
  { name: 'Indie Records', type: 'indie', advance: 5000, royalty: 0.5, duration: 5, desc: 'Small label, high royalties, low advance', tier: 'bronze' },
  { name: 'Rising Star Music', type: 'standard', advance: 25000, royalty: 0.3, duration: 10, desc: 'Mid-tier label, balanced deal', tier: 'silver' },
  { name: 'Platinum Entertainment', type: 'major', advance: 100000, royalty: 0.18, duration: 15, desc: 'Major label, big advance, lower royalties', tier: 'gold' },
  { name: 'Global Empire Records', type: 'mega', advance: 500000, royalty: 0.12, duration: 20, desc: 'Mega deal. Massive push, low royalties', tier: 'platinum' },
];

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2',
};

export default function RecordLabelApp({ profile }: Props) {
  const { user } = useAuth();
  const [deals, setDeals] = useState<any[]>([]);
  const [tab, setTab] = useState<'offers' | 'deals'>('offers');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    supabase.from('record_deals').select('*').eq('artist_id', profile.id).order('signed_at', { ascending: false })
      .then(({ data }) => { if (data) setDeals(data); });
  }, [profile.id]);

  const activeDeal = deals.find(d => d.active);

  const handleSign = async (label: typeof LABELS[0]) => {
    if (!user) return;
    if (activeDeal) { toast.error("You're already signed to a label!"); return; }
    setSigning(true);
    await new Promise(r => setTimeout(r, 2000));

    const { error } = await supabase.from('record_deals').insert({
      artist_id: profile.id, label_name: label.name, deal_type: label.type,
      advance_amount: label.advance, royalty_rate: label.royalty,
      duration_turns: label.duration, turns_remaining: label.duration,
    });
    if (error) { toast.error(error.message); setSigning(false); return; }

    // Get the advance
    await supabase.from('profiles').update({
      current_money: profile.current_money + label.advance,
      monthly_listeners: profile.monthly_listeners + Math.floor(label.advance * 0.02),
      spotify_followers: profile.spotify_followers + Math.floor(label.advance * 0.01),
    }).eq('id', profile.id);

    toast.success(`Signed to ${label.name}! +${formatMoney(label.advance)} advance!`);
    setSigning(false);

    const { data: updated } = await supabase.from('record_deals').select('*').eq('artist_id', profile.id).order('signed_at', { ascending: false });
    if (updated) setDeals(updated);
  };

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#0ea5e9]/30 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Record Labels</h1>
            <p className="text-xs text-white/60">{activeDeal ? `Signed: ${activeDeal.label_name}` : 'Unsigned / Independent'}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#222] mx-4">
        <button onClick={() => setTab('offers')} className={`flex-1 py-3 text-sm font-medium ${tab === 'offers' ? 'text-white border-b-2 border-[#0ea5e9]' : 'text-[#888]'}`}>Offers</button>
        <button onClick={() => setTab('deals')} className={`flex-1 py-3 text-sm font-medium ${tab === 'deals' ? 'text-white border-b-2 border-[#0ea5e9]' : 'text-[#888]'}`}>My Deals ({deals.length})</button>
      </div>

      {tab === 'offers' && (
        <div className="px-4 py-4 space-y-3">
          {activeDeal && (
            <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-[#0ea5e9]" />
                <span>Currently signed to <strong>{activeDeal.label_name}</strong></span>
              </div>
              <p className="text-xs text-[#888] mt-1">{activeDeal.turns_remaining} turns remaining • {(activeDeal.royalty_rate * 100).toFixed(0)}% royalty rate</p>
            </div>
          )}

          {LABELS.map((label) => {
            const color = TIER_COLORS[label.tier];
            return (
              <div key={label.name} className="bg-[#1a1a1a] rounded-xl p-4" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" style={{ color }} />
                    <h3 className="font-bold text-sm">{label.name}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: `${color}20`, color }}>{label.tier}</span>
                </div>
                <p className="text-xs text-[#888] mb-3">{label.desc}</p>
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-[#282828] rounded-lg p-2 text-center">
                    <DollarSign className="w-3 h-3 mx-auto mb-0.5 text-[#1db954]" />
                    <p className="font-bold">{formatMoney(label.advance)}</p>
                    <p className="text-[10px] text-[#888]">Advance</p>
                  </div>
                  <div className="bg-[#282828] rounded-lg p-2 text-center">
                    <TrendingUp className="w-3 h-3 mx-auto mb-0.5 text-[#f59e0b]" />
                    <p className="font-bold">{(label.royalty * 100).toFixed(0)}%</p>
                    <p className="text-[10px] text-[#888]">Royalty</p>
                  </div>
                  <div className="bg-[#282828] rounded-lg p-2 text-center">
                    <Clock className="w-3 h-3 mx-auto mb-0.5 text-[#8b5cf6]" />
                    <p className="font-bold">{label.duration}</p>
                    <p className="text-[10px] text-[#888]">Turns</p>
                  </div>
                </div>
                <button onClick={() => handleSign(label)} disabled={signing || !!activeDeal}
                  className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                  style={{ background: activeDeal ? '#333' : `${color}30`, color: activeDeal ? '#666' : color }}>
                  {activeDeal ? 'Already Signed' : signing ? 'Signing...' : `Sign Deal (+${formatMoney(label.advance)})`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'deals' && (
        <div className="px-4 py-4 space-y-3">
          {deals.length > 0 ? deals.map((deal) => (
            <div key={deal.id} className={`bg-[#1a1a1a] rounded-xl p-4 ${deal.active ? 'ring-1 ring-[#0ea5e9]' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{deal.label_name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${deal.active ? 'bg-[#1db954]/20 text-[#1db954]' : 'bg-[#333] text-[#888]'}`}>
                  {deal.active ? 'Active' : 'Expired'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#888]">
                <span><DollarSign className="w-3 h-3 inline" /> {formatMoney(deal.advance_amount)} advance</span>
                <span>{(deal.royalty_rate * 100).toFixed(0)}% royalty</span>
                <span>{deal.turns_remaining} turns left</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-[#888]">
              <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No deals signed yet</p>
              <p className="text-xs mt-1">Check out the offers tab!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
