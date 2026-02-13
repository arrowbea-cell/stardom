import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/hooks/useProfile';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Shield, Trash2, DollarSign, Sprout, BarChart3, Music, Users, TrendingUp, Lock, Eye, EyeOff, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

export default function AdminApp({ profile }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [artists, setArtists] = useState<Profile[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Profile | null>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [boostAmount, setBoostAmount] = useState('100000');

  useEffect(() => {
    if (!unlocked) return;
    fetchData();
  }, [unlocked]);

  const fetchData = async () => {
    const { data: a } = await supabase.from('profiles').select('*').order('total_streams', { ascending: false }).limit(100);
    if (a) setArtists(a as Profile[]);
    const { data: s } = await supabase.from('songs').select('*, profiles!songs_artist_id_fkey(artist_name)').order('streams', { ascending: false }).limit(100);
    if (s) setSongs(s);
  };

  const callAdmin = async (action: string, extra: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('admin-actions', {
        body: { password, action, ...extra },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data?.message || 'Action completed');
        await fetchData();
        if (action === 'delete_artist') setSelectedArtist(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    // Test the password by calling a harmless action
    try {
      const res = await supabase.functions.invoke('admin-actions', {
        body: { password, action: 'test' },
      });
      const data = res.data as any;
      if (data?.error === 'Unauthorized') {
        toast.error('Wrong password');
        setLoading(false);
        return;
      }
      // Even "Unknown action" means password was accepted
      setUnlocked(true);
      toast.success('Admin panel unlocked');
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = searchQuery
    ? artists.filter(a => a.artist_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : artists;

  const artistSongs = selectedArtist
    ? songs.filter(s => s.artist_id === selectedArtist.id)
    : songs;

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-[#888] mt-1">Enter password to continue</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Password"
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-red-500 transition-colors"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-[#666]" /> : <Eye className="w-4 h-4 text-[#666]" />}
              </button>
            </div>
            <button
              onClick={handleUnlock}
              disabled={loading || !password}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-500/20 to-transparent p-4 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-xs text-[#888]">Manage artists, streams, and charts</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2.5">
          <Search className="w-4 h-4 text-[#666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search artists..."
            className="bg-transparent text-sm text-white placeholder-[#666] outline-none flex-1"
          />
          {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-[#666]" /></button>}
        </div>
      </div>

      {/* Artist list */}
      <div className="px-4 mb-6">
        <h2 className="text-sm font-bold text-[#888] mb-3">Artists ({filteredArtists.length})</h2>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {filteredArtists.map((artist) => (
            <button
              key={artist.id}
              onClick={() => { setSelectedArtist(artist); setSelectedSong(null); }}
              className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-colors ${
                selectedArtist?.id === artist.id ? 'bg-red-500/20 border border-red-500/30' : 'bg-[#141414] hover:bg-[#1e1e1e]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users className="w-4 h-4 text-[#666]" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{artist.artist_name}</p>
                <p className="text-xs text-[#888]">{formatNumber(artist.total_streams)} streams • {formatMoney(artist.current_money)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected artist actions */}
      {selectedArtist && (
        <div className="px-4 space-y-4">
          <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                {selectedArtist.avatar_url ? <img src={selectedArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-[#666] m-3.5" />}
              </div>
              <div>
                <p className="font-bold">{selectedArtist.artist_name}</p>
                <p className="text-xs text-[#888]">{formatNumber(selectedArtist.monthly_listeners)} monthly listeners</p>
              </div>
            </div>

            {/* Boost amount */}
            <div className="mb-4">
              <label className="text-xs text-[#888] mb-1 block">Boost Amount</label>
              <input
                type="number"
                value={boostAmount}
                onChange={(e) => setBoostAmount(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => callAdmin('boost_listeners', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50"
              >
                <Users className="w-3.5 h-3.5" /> Boost Listeners
              </button>
              <button
                onClick={() => callAdmin('payola', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50"
              >
                <DollarSign className="w-3.5 h-3.5" /> Payola
              </button>
              <button
                onClick={() => callAdmin('industry_plant', { artist_id: selectedArtist.id })}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50"
              >
                <Sprout className="w-3.5 h-3.5" /> Industry Plant
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedArtist.artist_name} and all their data?`)) {
                    callAdmin('delete_artist', { artist_id: selectedArtist.id });
                  }
                }}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Artist
              </button>
            </div>
          </div>

          {/* Songs for selected artist */}
          <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-red-400" /> Songs by {selectedArtist.artist_name}
            </h3>
            {artistSongs.length > 0 ? (
              <div className="space-y-1">
                {artistSongs.map((song: any) => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-colors ${
                      selectedSong?.id === song.id ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-[#0a0a0a] hover:bg-[#1e1e1e]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-[#222] overflow-hidden flex-shrink-0">
                      {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-3 h-3 text-[#666] m-2.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{song.title}</p>
                      <p className="text-[10px] text-[#888]">{formatNumber(song.streams)} streams</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#888]">No songs</p>
            )}

            {/* Song actions */}
            {selectedSong && (
              <div className="mt-3 pt-3 border-t border-[#222] grid grid-cols-2 gap-2">
                <button
                  onClick={() => callAdmin('boost_streams', { song_id: selectedSong.id, amount: parseInt(boostAmount) })}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Boost Streams
                </button>
                <button
                  onClick={() => callAdmin('chart_placement', { song_id: selectedSong.id, amount: 1 })}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> #1 on Charts
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      )}
    </div>
  );
}
