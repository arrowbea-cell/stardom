import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/supabase-helpers';
import { MapPin, Building, Clock, Plane, Home, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props { profile: Profile; }

const DESTINATIONS: Record<string, { city: string; apartments: { name: string; tier: string; daily: number; emoji: string }[] }[]> = {
  'United Kingdom': [{ city: 'London', apartments: [
    { name: 'Budget Flat', tier: 'budget', daily: 200, emoji: '🏚️' },
    { name: 'City Apartment', tier: 'standard', daily: 500, emoji: '🏢' },
    { name: 'Penthouse Suite', tier: 'luxury', daily: 2000, emoji: '🏙️' },
  ]}],
  'France': [{ city: 'Paris', apartments: [
    { name: 'Hostel Room', tier: 'budget', daily: 150, emoji: '🏚️' },
    { name: 'Champs-Élysées Apt', tier: 'standard', daily: 600, emoji: '🏢' },
    { name: 'Luxury Villa', tier: 'luxury', daily: 2500, emoji: '🏰' },
  ]}],
  'Japan': [{ city: 'Tokyo', apartments: [
    { name: 'Capsule Hotel', tier: 'budget', daily: 100, emoji: '🏚️' },
    { name: 'Shibuya Apartment', tier: 'standard', daily: 400, emoji: '🏢' },
    { name: 'Roppongi Penthouse', tier: 'luxury', daily: 1800, emoji: '🏙️' },
  ]}],
  'Dubai (UAE)': [{ city: 'Dubai', apartments: [
    { name: 'Marina Flat', tier: 'budget', daily: 300, emoji: '🏚️' },
    { name: 'Downtown Apt', tier: 'standard', daily: 800, emoji: '🏢' },
    { name: 'Palm Jumeirah Villa', tier: 'luxury', daily: 5000, emoji: '🏝️' },
  ]}],
  'South Korea': [{ city: 'Seoul', apartments: [
    { name: 'Goshiwon', tier: 'budget', daily: 80, emoji: '🏚️' },
    { name: 'Gangnam Apt', tier: 'standard', daily: 350, emoji: '🏢' },
    { name: 'Luxury Officetel', tier: 'luxury', daily: 1500, emoji: '🏙️' },
  ]}],
  'Nigeria': [{ city: 'Lagos', apartments: [
    { name: 'Basic Room', tier: 'budget', daily: 50, emoji: '🏚️' },
    { name: 'Ikoyi Apartment', tier: 'standard', daily: 200, emoji: '🏢' },
    { name: 'Banana Island Villa', tier: 'luxury', daily: 1000, emoji: '🏝️' },
  ]}],
  'Jamaica': [{ city: 'Kingston', apartments: [
    { name: 'Beach Shack', tier: 'budget', daily: 60, emoji: '🏖️' },
    { name: 'New Kingston Apt', tier: 'standard', daily: 150, emoji: '🏢' },
    { name: 'Blue Mountain Villa', tier: 'luxury', daily: 800, emoji: '🏔️' },
  ]}],
  'Brazil': [{ city: 'Rio de Janeiro', apartments: [
    { name: 'Copacabana Room', tier: 'budget', daily: 100, emoji: '🏖️' },
    { name: 'Ipanema Flat', tier: 'standard', daily: 300, emoji: '🏢' },
    { name: 'Leblon Penthouse', tier: 'luxury', daily: 1200, emoji: '🏙️' },
  ]}],
};

const DURATIONS = [1, 3, 7, 14, 30];

export default function TravelTab({ profile }: Props) {
  const [visas, setVisas] = useState<string[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [duration, setDuration] = useState(3);

  useEffect(() => {
    supabase.from('visas').select('country').eq('artist_id', profile.id)
      .then(({ data }) => { if (data) setVisas(data.map(v => v.country)); });
    supabase.from('travels').select('*').eq('artist_id', profile.id).eq('active', true).maybeSingle()
      .then(({ data }) => { if (data) setActiveTrip(data); });
  }, [profile.id]);

  const availableCountries = Object.keys(DESTINATIONS).filter(c => visas.includes(c));
  const cities = selectedCountry ? DESTINATIONS[selectedCountry] || [] : [];

  const bookTrip = async () => {
    if (!selectedApt || !selectedCountry) return;
    const totalCost = selectedApt.daily * duration;
    if (totalCost > profile.current_money) { toast.error('Not enough money'); return; }

    await supabase.from('profiles').update({
      current_money: profile.current_money - totalCost,
      current_country: selectedCountry,
    }).eq('id', profile.id);

    const city = cities[0]?.city || selectedCountry;
    const { data } = await supabase.from('travels').insert({
      artist_id: profile.id,
      country: selectedCountry,
      city,
      apartment_name: selectedApt.name,
      apartment_tier: selectedApt.tier,
      daily_rent: selectedApt.daily,
      duration_days: duration,
    }).select().single();

    if (data) setActiveTrip(data);
    toast.success(`Traveling to ${city}! ✈️`);
  };

  const goHome = async () => {
    if (activeTrip) {
      await supabase.from('travels').update({ active: false }).eq('id', activeTrip.id);
    }
    await supabase.from('profiles').update({
      current_country: profile.home_country || 'United States',
    }).eq('id', profile.id);
    setActiveTrip(null);
    toast.success('Welcome home! 🏠');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Plane className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Travel</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          📍 Currently in: {profile.current_country || 'United States'}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTrip ? (
          <div className="glass-card p-4 border-primary/30 space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Active Stay</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Location:</span> {activeTrip.city}, {activeTrip.country}</p>
              <p><span className="text-muted-foreground">Apartment:</span> {activeTrip.apartment_name}</p>
              <p><span className="text-muted-foreground">Duration:</span> {activeTrip.duration_days} days</p>
              <p><span className="text-muted-foreground">Daily Rent:</span> {formatMoney(activeTrip.daily_rent)}</p>
              <p className="text-primary font-semibold">Total: {formatMoney(activeTrip.daily_rent * activeTrip.duration_days)}</p>
            </div>
            <Button onClick={goHome} variant="outline" className="w-full"><Home className="w-4 h-4 mr-1" /> Return Home</Button>
          </div>
        ) : (
          <>
            {availableCountries.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Get visas first to unlock travel destinations!</p>
              </div>
            ) : (
              <>
                <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setSelectedApt(null); }}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm">
                  <option value="">Choose destination...</option>
                  {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {cities.map(city => (
                  <div key={city.city} className="space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" /> {city.city}</p>
                    {city.apartments.map(apt => (
                      <motion.button
                        key={apt.name}
                        onClick={() => setSelectedApt(apt)}
                        className={`glass-card p-3 w-full text-left flex items-center gap-3 transition-all ${
                          selectedApt?.name === apt.name ? 'border-primary/50 bg-primary/5' : ''
                        }`}
                      >
                        <span className="text-2xl">{apt.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{apt.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{apt.tier} • {formatMoney(apt.daily)}/day</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ))}

                {selectedApt && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</p>
                    <div className="flex gap-2 flex-wrap">
                      {DURATIONS.map(d => (
                        <button key={d} onClick={() => setDuration(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            duration === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          }`}>{d} {d === 1 ? 'day' : 'days'}</button>
                      ))}
                    </div>
                    <div className="glass-card p-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Daily rent</span><span>{formatMoney(selectedApt.daily)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{duration} days</span></div>
                      <div className="flex justify-between font-semibold text-primary mt-1 pt-1 border-t border-border">
                        <span>Total</span><span>{formatMoney(selectedApt.daily * duration)}</span>
                      </div>
                    </div>
                    <Button onClick={bookTrip} className="w-full"><Plane className="w-4 h-4 mr-1" /> Book Trip</Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
