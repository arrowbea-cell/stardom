import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Radio, Music, DollarSign, TrendingUp, Zap, Signal, Waves, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

const STATIONS = [
  { name: 'Local FM', cost: 1000, spins: 500, reach: 10000, icon: Radio },
  { name: 'City Radio', cost: 5000, spins: 2000, reach: 50000, icon: Signal },
  { name: 'National Radio', cost: 15000, spins: 8000, reach: 200000, icon: Waves },
  { name: 'Global Syndication', cost: 50000, spins: 25000, reach: 1000000, icon: Zap },
];

export default function RadioApp({ profile }: Props) {
  const { user } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('songs').select('*').eq('artist_id', profile.id).gt('streams', 0).order('streams', { ascending: false })
      .then(({ data }) => { if (data) setSongs(data); });
  }, [profile.id]);

  const submitToRadio = async () => {
    if (!user || !selectedSong) return;
    const station = STATIONS[selectedStation];

    if (profile.current_money < station.cost) {
      toast.error("Can't afford this radio campaign!");
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));

    // Update song radio spins
    const song = songs.find(s => s.id === selectedSong);
    if (song) {
      await supabase.from('songs').update({
        radio_spins: song.radio_spins + station.spins,
        streams: song.streams + Math.floor(station.reach * 0.05),
      }).eq('id', selectedSong);
    }

    // Update profile
    await supabase.from('profiles').update({
      current_money: profile.current_money - station.cost,
      monthly_listeners: profile.monthly_listeners + Math.floor(station.reach * 0.02),
      total_streams: profile.total_streams + Math.floor(station.reach * 0.05),
    }).eq('id', profile.id);

    // Create promotion record
    await supabase.from('promotions').insert({
      song_id: selectedSong, artist_id: profile.id,
      promotion_type: 'radio', cost: station.cost,
      boost_multiplier: station.spins / 500,
    });

    toast.success(`${station.name} playing your track! +${formatNumber(station.spins)} spins!`);
    setSubmitting(false);

    const { data: updated } = await supabase.from('songs').select('*').eq('artist_id', profile.id).gt('streams', 0).order('streams', { ascending: false });
    if (updated) setSongs(updated);
  };

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#f59e0b]/30 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
            <Radio className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Radio Promotion</h1>
            <p className="text-xs text-white/60">Get your music on the airwaves</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Select song */}
        <div>
          <h3 className="text-sm font-bold text-[#888] mb-2">Select Song to Promote</h3>
          {songs.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {songs.map((song) => (
                <button key={song.id} onClick={() => setSelectedSong(song.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                    selectedSong === song.id ? 'bg-[#f59e0b]/20 ring-1 ring-[#f59e0b]' : 'bg-[#1a1a1a]'
                  }`}>
                  <div className="w-10 h-10 rounded-lg bg-[#282828] overflow-hidden flex-shrink-0">
                    {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#555] m-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-[#888]">{formatNumber(song.streams)} streams • {formatNumber(song.radio_spins)} spins</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#888] bg-[#1a1a1a] rounded-xl p-4">Release a song first to promote on radio!</p>
          )}
        </div>

        {/* Select station */}
        <div>
          <h3 className="text-sm font-bold text-[#888] mb-2">Radio Station</h3>
          <div className="space-y-2">
            {STATIONS.map((station, i) => {
              const StationIcon = station.icon;
              return (
                <button key={i} onClick={() => setSelectedStation(i)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left ${
                    selectedStation === i ? 'bg-[#f59e0b]/20 ring-1 ring-[#f59e0b]' : 'bg-[#1a1a1a]'
                  }`}>
                  <div className="w-10 h-10 rounded-lg bg-[#282828] flex items-center justify-center">
                    <StationIcon className="w-5 h-5 text-[#f59e0b]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{station.name}</p>
                      <p className="text-sm font-bold text-[#f59e0b]">{formatMoney(station.cost)}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#888]">
                      <span><Radio className="w-3 h-3 inline" /> {formatNumber(station.spins)} spins</span>
                      <span><Users className="w-3 h-3 inline" /> {formatNumber(station.reach)} reach</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={submitToRadio} disabled={submitting || !selectedSong}
          className="w-full bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-xl py-4 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Submitting...</>
            : <><Radio className="w-5 h-5" /> Submit to Radio ({formatMoney(STATIONS[selectedStation].cost)})</>}
        </button>

        {/* Current radio stats */}
        {songs.filter(s => s.radio_spins > 0).length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Songs on Radio</h3>
            <div className="space-y-2">
              {songs.filter(s => s.radio_spins > 0).map((song) => (
                <div key={song.id} className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-3">
                  <Radio className="w-5 h-5 text-[#f59e0b]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{song.title}</p>
                    <p className="text-[10px] text-[#888]">{formatNumber(song.radio_spins)} total spins</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
