import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Ticket, MapPin, Users, DollarSign, Music, Star, TrendingUp, Calendar, Building } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

const VENUES = [
  { name: 'Local Bar', capacity: 100, baseCost: 500, icon: Music, tier: 'small' },
  { name: 'Club', capacity: 500, baseCost: 2000, icon: Building, tier: 'medium' },
  { name: 'Theater', capacity: 2000, baseCost: 8000, icon: Building, tier: 'large' },
  { name: 'Arena', capacity: 15000, baseCost: 30000, icon: Star, tier: 'arena' },
  { name: 'Stadium', capacity: 60000, baseCost: 100000, icon: Star, tier: 'stadium' },
];

const CITIES = [
  { city: 'Los Angeles', country: 'United States', multiplier: 1.2 },
  { city: 'New York', country: 'United States', multiplier: 1.3 },
  { city: 'London', country: 'United Kingdom', multiplier: 1.25 },
  { city: 'Tokyo', country: 'Japan', multiplier: 1.15 },
  { city: 'Paris', country: 'France', multiplier: 1.2 },
  { city: 'Lagos', country: 'Nigeria', multiplier: 1.0 },
  { city: 'São Paulo', country: 'Brazil', multiplier: 1.1 },
  { city: 'Seoul', country: 'South Korea', multiplier: 1.15 },
  { city: 'Berlin', country: 'Germany', multiplier: 1.1 },
  { city: 'Toronto', country: 'Canada', multiplier: 1.1 },
];

export default function ConcertApp({ profile }: Props) {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState<any[]>([]);
  const [tab, setTab] = useState<'book' | 'history'>('book');
  const [selectedVenue, setSelectedVenue] = useState(0);
  const [selectedCity, setSelectedCity] = useState(0);
  const [ticketPrice, setTicketPrice] = useState('50');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    supabase.from('concerts').select('*').eq('artist_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setConcerts(data); });
  }, [profile.id]);

  const handleBook = async () => {
    if (!user) return;
    const venue = VENUES[selectedVenue];
    const city = CITIES[selectedCity];
    const price = parseInt(ticketPrice) || 50;

    if (profile.current_money < venue.baseCost) {
      toast.error("Can't afford this venue!");
      return;
    }

    setBooking(true);
    await new Promise(r => setTimeout(r, 2000));

    // Calculate tickets sold based on popularity
    const popularityFactor = Math.min(1, (profile.monthly_listeners / 100000) + 0.1);
    const cityMult = city.multiplier;
    const maxSold = Math.floor(venue.capacity * popularityFactor * cityMult);
    const ticketsSold = Math.floor(Math.random() * maxSold * 0.3 + maxSold * 0.5);
    const revenue = ticketsSold * price;

    const { error } = await supabase.from('concerts').insert({
      artist_id: profile.id,
      city: city.city,
      country: city.country,
      venue_name: venue.name,
      venue_capacity: venue.capacity,
      ticket_price: price,
      tickets_sold: ticketsSold,
      revenue,
      status: 'completed',
    });

    if (error) { toast.error(error.message); setBooking(false); return; }

    // Update profile
    const netProfit = revenue - venue.baseCost;
    await supabase.from('profiles').update({
      current_money: profile.current_money + netProfit,
      monthly_listeners: profile.monthly_listeners + Math.floor(ticketsSold * 0.5),
      spotify_followers: profile.spotify_followers + Math.floor(ticketsSold * 0.1),
      x_followers: profile.x_followers + Math.floor(ticketsSold * 0.05),
    }).eq('id', profile.id);

    toast.success(`Concert sold ${formatNumber(ticketsSold)} tickets! ${netProfit >= 0 ? `+${formatMoney(netProfit)}` : formatMoney(netProfit)} net`);
    setBooking(false);

    const { data: updated } = await supabase.from('concerts').select('*').eq('artist_id', profile.id).order('created_at', { ascending: false });
    if (updated) setConcerts(updated);
  };

  const totalRevenue = concerts.reduce((s, c) => s + c.revenue, 0);
  const totalTickets = concerts.reduce((s, c) => s + c.tickets_sold, 0);

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#7c3aed]/30 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Concerts & Tours</h1>
            <p className="text-xs text-white/60">{concerts.length} shows • {formatNumber(totalTickets)} tickets sold</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#222] mx-4">
        <button onClick={() => setTab('book')} className={`flex-1 py-3 text-sm font-medium ${tab === 'book' ? 'text-white border-b-2 border-[#7c3aed]' : 'text-[#888]'}`}>Book Show</button>
        <button onClick={() => setTab('history')} className={`flex-1 py-3 text-sm font-medium ${tab === 'history' ? 'text-white border-b-2 border-[#7c3aed]' : 'text-[#888]'}`}>History ({concerts.length})</button>
      </div>

      {tab === 'book' && (
        <div className="px-4 py-4 space-y-5">
          {/* City */}
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Select City</h3>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((c, i) => (
                <button key={i} onClick={() => setSelectedCity(i)}
                  className={`px-3 py-2.5 rounded-xl text-left text-xs ${selectedCity === i ? 'bg-[#7c3aed]/20 ring-1 ring-[#7c3aed]' : 'bg-[#1a1a1a]'}`}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#7c3aed]" />
                    <span className="font-medium">{c.city}</span>
                  </div>
                  <p className="text-[10px] text-[#888] mt-0.5 ml-5.5">{c.country}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Venue */}
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Select Venue</h3>
            <div className="space-y-2">
              {VENUES.map((v, i) => {
                const VenueIcon = v.icon;
                return (
                  <button key={i} onClick={() => setSelectedVenue(i)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left ${selectedVenue === i ? 'bg-[#7c3aed]/20 ring-1 ring-[#7c3aed]' : 'bg-[#1a1a1a]'}`}>
                    <div className="w-10 h-10 rounded-lg bg-[#282828] flex items-center justify-center">
                      <VenueIcon className="w-5 h-5 text-[#7c3aed]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{v.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#888]">
                        <span><Users className="w-3 h-3 inline" /> {formatNumber(v.capacity)} cap</span>
                        <span><DollarSign className="w-3 h-3 inline" /> {formatMoney(v.baseCost)} cost</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket price */}
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Ticket Price</h3>
            <input type="number" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)}
              className="w-full bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-[#7c3aed]" placeholder="$50" />
          </div>

          <button onClick={handleBook} disabled={booking}
            className="w-full bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] rounded-xl py-4 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {booking ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking...</>
              : <><Ticket className="w-5 h-5" /> Book Concert ({formatMoney(VENUES[selectedVenue].baseCost)})</>}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="px-4 py-4 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-[#1a1a1a] rounded-xl p-3">
              <DollarSign className="w-4 h-4 text-[#7c3aed] mb-1" />
              <p className="font-bold">{formatMoney(totalRevenue)}</p>
              <p className="text-[10px] text-[#888]">Total Revenue</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-3">
              <Users className="w-4 h-4 text-[#7c3aed] mb-1" />
              <p className="font-bold">{formatNumber(totalTickets)}</p>
              <p className="text-[10px] text-[#888]">Tickets Sold</p>
            </div>
          </div>

          {concerts.length > 0 ? concerts.map((c) => (
            <div key={c.id} className="bg-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#7c3aed]" />
                  <span className="font-bold text-sm">{c.city}, {c.country}</span>
                </div>
                <span className="text-xs text-[#7c3aed] font-medium">{c.venue_name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#888]">
                <span><Users className="w-3 h-3 inline" /> {formatNumber(c.tickets_sold)}/{formatNumber(c.venue_capacity)}</span>
                <span><DollarSign className="w-3 h-3 inline" /> {formatMoney(c.revenue)} rev</span>
                <span>${c.ticket_price}/ticket</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-[#888]">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No concerts yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
