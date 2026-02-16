import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/hooks/useProfile';
import { useGameState } from '@/hooks/useGameState';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Shield, Trash2, DollarSign, Sprout, BarChart3, Music, Users, TrendingUp, Lock, Eye, EyeOff, Loader2, Search, X, Clock, Zap, RefreshCw, Hash, Mic2, Award, Timer, SkipForward, Banknote, Globe, RotateCcw, Rocket, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

export default function AdminApp({ profile }: Props) {
  const { gameState, formatTimeLeft } = useGameState();
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
  const [tab, setTab] = useState<'artists' | 'songs' | 'game' | 'stats'>('artists');
  const [turnDuration, setTurnDuration] = useState('');
  const [followerPlatform, setFollowerPlatform] = useState('spotify');
  const [followerCount, setFollowerCount] = useState('100000');

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
    try {
      const res = await supabase.functions.invoke('admin-actions', {
        body: { password, action: 'test' },
      });
      if (res.error) { toast.error('Wrong password'); setLoading(false); return; }
      setUnlocked(true);
      toast.success('Admin panel unlocked');
    } catch { toast.error('Connection error'); }
    finally { setLoading(false); }
  };

  const filteredArtists = searchQuery
    ? artists.filter(a => a.artist_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : artists;

  const artistSongs = selectedArtist ? songs.filter(s => s.artist_id === selectedArtist.id) : [];

  const totalStreams = artists.reduce((sum, a) => sum + a.total_streams, 0);
  const totalMoney = artists.reduce((sum, a) => sum + a.current_money, 0);

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
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="Password" className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-red-500 transition-colors" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-[#666]" /> : <Eye className="w-4 h-4 text-[#666]" />}
              </button>
            </div>
            <button onClick={handleUnlock} disabled={loading || !password}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />} Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-500/20 to-transparent p-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#888]">
            <Clock className="w-3 h-3" />
            <span>T{gameState?.current_turn ?? 0} · {formatTimeLeft()}</span>
          </div>
        </div>
      </div>

      {/* Tab bar - responsive for iPad */}
      <div className="flex gap-1 px-4 mb-4 overflow-x-auto">
        {(['artists', 'songs', 'game', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium capitalize whitespace-nowrap ${tab === t ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#141414] text-[#888]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* iPad-friendly grid layout */}
      <div className="px-4">
        {tab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <Users className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-2xl font-bold">{artists.length}</p>
              <p className="text-xs text-[#888]">Total Artists</p>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <Music className="w-5 h-5 text-green-400 mb-2" />
              <p className="text-2xl font-bold">{songs.length}</p>
              <p className="text-xs text-[#888]">Total Songs</p>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-2xl font-bold">{formatNumber(totalStreams)}</p>
              <p className="text-xs text-[#888]">Total Streams</p>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold">{formatMoney(totalMoney)}</p>
              <p className="text-xs text-[#888]">Money in Economy</p>
            </div>
            {/* Leaderboard */}
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222] col-span-2 md:col-span-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Top 10 Artists</h3>
              <div className="space-y-2">
                {artists.slice(0, 10).map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className={`w-5 text-right text-xs font-bold ${i < 3 ? 'text-yellow-400' : 'text-[#666]'}`}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                      {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-3 h-3 text-[#666] m-2.5" />}
                    </div>
                    <span className="text-xs font-medium flex-1 truncate">{a.artist_name}</span>
                    <span className="text-xs text-[#888]">{formatNumber(a.total_streams)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'game' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Game State</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#888]">Current Turn</span><span className="font-bold">{gameState?.current_turn ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-[#888]">Turn Duration</span><span className="font-bold">{gameState?.turn_duration_minutes ?? 0} min</span></div>
                <div className="flex justify-between"><span className="text-[#888]">Next Turn</span><span className="font-mono text-blue-400">{formatTimeLeft()}</span></div>
              </div>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Timer className="w-4 h-4 text-orange-400" /> Fix Time</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Turn Duration (minutes)</label>
                  <div className="flex gap-2">
                    <input type="number" value={turnDuration} onChange={(e) => setTurnDuration(e.target.value)} placeholder={String(gameState?.turn_duration_minutes || 60)}
                      className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500" />
                    <button onClick={() => callAdmin('set_turn_duration', { amount: parseInt(turnDuration) || 60 })} disabled={loading}
                      className="px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-medium disabled:opacity-50">
                      Set
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[15, 30, 60, 120].map(m => (
                    <button key={m} onClick={() => callAdmin('set_turn_duration', { amount: m })} disabled={loading}
                      className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg py-2 text-xs font-medium hover:border-orange-500/50 disabled:opacity-50">
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => callAdmin('reset_timer')} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Timer
                </button>
                <button onClick={() => callAdmin('force_next_turn')} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                  <SkipForward className="w-3.5 h-3.5" /> Skip Turn
                </button>
                <button onClick={() => {
                  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-turn`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }
                  }).then(() => toast.success('Turn processing triggered!')).catch(() => toast.error('Failed'));
                }} className="flex items-center justify-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2.5 text-xs font-medium">
                  <Rocket className="w-3.5 h-3.5" /> Process Turn
                </button>
                <button onClick={() => callAdmin('boost_all_streams', { amount: parseInt(boostAmount) || 50000 })} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                  <TrendingUp className="w-3.5 h-3.5" /> Boost All Streams
                </button>
              </div>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-400" /> Economy Controls</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" value={boostAmount} onChange={(e) => setBoostAmount(e.target.value)} placeholder="Amount"
                    className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => callAdmin('give_money_all', { amount: parseInt(boostAmount) || 10000 })} disabled={loading}
                    className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                    <DollarSign className="w-3.5 h-3.5" /> Give All $
                  </button>
                  <button onClick={() => { if (confirm('Reset all money to starting amounts?')) callAdmin('reset_economy'); }} disabled={loading}
                    className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Economy
                  </button>
                </div>
              </div>
            </div>
            {/* Set Followers panel */}
            {selectedArtist && (
              <div className="bg-[#141414] rounded-xl p-4 border border-[#222] md:col-span-2">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-pink-400" /> Set Followers: {selectedArtist.artist_name}</h3>
                <div className="flex gap-2 mb-2">
                  <select value={followerPlatform} onChange={(e) => setFollowerPlatform(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none">
                    <option value="spotify">Spotify</option>
                    <option value="apple">Apple Music</option>
                    <option value="youtube">YouTube</option>
                    <option value="x">X</option>
                    <option value="monthly">Monthly Listeners</option>
                  </select>
                  <input type="number" value={followerCount} onChange={(e) => setFollowerCount(e.target.value)} placeholder="Count"
                    className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-500" />
                  <button onClick={() => callAdmin('set_followers', { artist_id: selectedArtist.id, platform: followerPlatform, count: parseInt(followerCount) || 0 })} disabled={loading}
                    className="px-4 py-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg text-xs font-medium disabled:opacity-50">
                    Set
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'artists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Artist list panel */}
            <div>
              <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2.5 mb-3">
                <Search className="w-4 h-4 text-[#666]" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search artists..."
                  className="bg-transparent text-sm text-white placeholder-[#666] outline-none flex-1" />
                {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-[#666]" /></button>}
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredArtists.map((artist) => (
                  <button key={artist.id} onClick={() => { setSelectedArtist(artist); setSelectedSong(null); }}
                    className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-colors ${selectedArtist?.id === artist.id ? 'bg-red-500/20 border border-red-500/30' : 'bg-[#141414] hover:bg-[#1e1e1e]'}`}>
                    <div className="w-10 h-10 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                      {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-[#666] m-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{artist.artist_name}</p>
                      <p className="text-xs text-[#888]">{formatNumber(artist.total_streams)} streams · {formatMoney(artist.current_money)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Artist actions panel */}
            <div>
              {selectedArtist ? (
                <div className="space-y-4">
                  <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                        {selectedArtist.avatar_url ? <img src={selectedArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-[#666] m-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{selectedArtist.artist_name}</p>
                        <p className="text-xs text-[#888]">{formatNumber(selectedArtist.monthly_listeners)} monthly · {formatNumber(selectedArtist.spotify_followers)} Spotify · {formatNumber(selectedArtist.youtube_subscribers)} YT</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs text-[#888] mb-1 block">Boost Amount</label>
                      <input type="number" value={boostAmount} onChange={(e) => setBoostAmount(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => callAdmin('boost_listeners', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                        <Users className="w-3.5 h-3.5" /> Boost Listeners
                      </button>
                      <button onClick={() => callAdmin('payola', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                        <DollarSign className="w-3.5 h-3.5" /> Payola
                      </button>
                      <button onClick={() => callAdmin('industry_plant', { artist_id: selectedArtist.id })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                        <Sprout className="w-3.5 h-3.5" /> Industry Plant
                      </button>
                      <button onClick={() => callAdmin('give_money', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                        <Banknote className="w-3.5 h-3.5" /> Give Money
                      </button>
                      <button onClick={() => { if (confirm(`Delete ${selectedArtist.artist_name} and all their data?`)) callAdmin('delete_artist', { artist_id: selectedArtist.id }); }} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Artist
                      </button>
                    </div>
                  </div>

                  {/* Artist's songs */}
                  <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Mic2 className="w-4 h-4 text-red-400" /> Songs ({artistSongs.length})
                    </h3>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {artistSongs.map((song: any) => (
                        <button key={song.id} onClick={() => setSelectedSong(song)}
                          className={`flex items-center gap-3 w-full text-left p-2 rounded-lg ${selectedSong?.id === song.id ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-[#0a0a0a] hover:bg-[#1e1e1e]'}`}>
                          <div className="w-8 h-8 rounded bg-[#222] overflow-hidden flex-shrink-0">
                            {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-3 h-3 text-[#666] m-2.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{song.title}</p>
                            <p className="text-[10px] text-[#888]">{formatNumber(song.streams)} streams</p>
                          </div>
                        </button>
                      ))}
                      {artistSongs.length === 0 && <p className="text-xs text-[#888]">No songs</p>}
                    </div>
                    {selectedSong && (
                      <div className="mt-3 pt-3 border-t border-[#222] grid grid-cols-2 gap-2">
                        <button onClick={() => callAdmin('boost_streams', { song_id: selectedSong.id, amount: parseInt(boostAmount) })} disabled={loading}
                          className="flex items-center justify-center gap-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                          <TrendingUp className="w-3.5 h-3.5" /> Boost Streams
                        </button>
                        <button onClick={() => callAdmin('chart_placement', { song_id: selectedSong.id, amount: 1 })} disabled={loading}
                          className="flex items-center justify-center gap-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                          <BarChart3 className="w-3.5 h-3.5" /> #1 on Charts
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#141414] rounded-xl p-8 border border-[#222] text-center">
                  <Users className="w-8 h-8 text-[#444] mx-auto mb-3" />
                  <p className="text-sm text-[#888]">Select an artist to manage</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'songs' && (
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-3">All Songs ({songs.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
              {songs.map((song: any) => (
                <div key={song.id} className="flex items-center gap-3 bg-[#141414] rounded-lg p-3">
                  <div className="w-10 h-10 rounded bg-[#222] overflow-hidden flex-shrink-0">
                    {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#666] m-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{song.title}</p>
                    <p className="text-[10px] text-[#888]">{song.profiles?.artist_name || 'Unknown'} · {formatNumber(song.streams)} streams</p>
                  </div>
                  <button onClick={() => { setSelectedArtist(artists.find(a => a.id === song.artist_id) || null); setSelectedSong(song); setTab('artists'); }}
                    className="text-[10px] text-red-400 hover:underline">Manage</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      )}
    </div>
  );
}
