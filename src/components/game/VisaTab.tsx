import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/supabase-helpers';
import { Globe, Stamp, Check, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props { profile: Profile; }

const COUNTRIES = [
  { name: 'United States', flag: '🇺🇸', cost: 0 },
  { name: 'United Kingdom', flag: '🇬🇧', cost: 2000 },
  { name: 'France', flag: '🇫🇷', cost: 2500 },
  { name: 'Japan', flag: '🇯🇵', cost: 3000 },
  { name: 'South Korea', flag: '🇰🇷', cost: 3000 },
  { name: 'Nigeria', flag: '🇳🇬', cost: 1500 },
  { name: 'Brazil', flag: '🇧🇷', cost: 2000 },
  { name: 'Canada', flag: '🇨🇦', cost: 1500 },
  { name: 'Germany', flag: '🇩🇪', cost: 2500 },
  { name: 'Australia', flag: '🇦🇺', cost: 3500 },
  { name: 'Italy', flag: '🇮🇹', cost: 2500 },
  { name: 'Spain', flag: '🇪🇸', cost: 2000 },
  { name: 'Jamaica', flag: '🇯🇲', cost: 1000 },
  { name: 'Dubai (UAE)', flag: '🇦🇪', cost: 4000 },
  { name: 'South Africa', flag: '🇿🇦', cost: 2000 },
  { name: 'Mexico', flag: '🇲🇽', cost: 1500 },
  { name: 'Ghana', flag: '🇬🇭', cost: 1500 },
  { name: 'Sweden', flag: '🇸🇪', cost: 2500 },
  { name: 'India', flag: '🇮🇳', cost: 2000 },
  { name: 'Colombia', flag: '🇨🇴', cost: 1800 },
];

export default function VisaTab({ profile }: Props) {
  const [visas, setVisas] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('visas').select('*').eq('artist_id', profile.id)
      .then(({ data }) => { if (data) setVisas(data); });
  }, [profile.id]);

  const hasVisa = (country: string) => visas.some(v => v.country === country);

  const getVisa = async (country: string, cost: number) => {
    if (cost > profile.current_money) { toast.error('Not enough money'); return; }
    if (hasVisa(country)) { toast.info('You already have this visa'); return; }

    await supabase.from('profiles').update({ current_money: profile.current_money - cost }).eq('id', profile.id);
    await supabase.from('visas').insert({ artist_id: profile.id, country, cost });
    setVisas([...visas, { country, cost }]);
    toast.success(`${country} visa obtained! 🛂`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Stamp className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Visa Office</h2>
        </div>
        <p className="text-xs text-muted-foreground">Get visas to travel the world • {visas.length} obtained</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {COUNTRIES.map((c, i) => {
          const owned = hasVisa(c.name);
          const isHome = c.name === (profile.home_country || 'United States');
          return (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`glass-card p-3 flex items-center gap-3 ${owned ? 'border-primary/30' : ''}`}
            >
              <span className="text-2xl">{c.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isHome ? 'Home country' : owned ? 'Visa obtained ✓' : formatMoney(c.cost)}
                </p>
              </div>
              {!isHome && !owned && (
                <Button size="sm" onClick={() => getVisa(c.name, c.cost)} className="text-xs h-8">
                  <Plane className="w-3 h-3 mr-1" /> Get Visa
                </Button>
              )}
              {owned && <Check className="w-4 h-4 text-primary" />}
              {isHome && <Globe className="w-4 h-4 text-muted-foreground" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
