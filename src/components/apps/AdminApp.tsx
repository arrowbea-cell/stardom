import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/hooks/useProfile';
import { useGameState } from '@/hooks/useGameState';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import {
  Shield, Trash2, DollarSign, Sprout, BarChart3, Music, Users, TrendingUp, Lock, Eye, EyeOff,
  Loader2, Search, X, Clock, Zap, RefreshCw, Mic2, Award, Timer, SkipForward, Banknote,
  Globe, RotateCcw, Rocket, AlertTriangle, Bomb, Hash, Activity, Database,
  PenLine, Tag, Ban, Star, Percent, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

interface Props { profile: Profile; }

type Tab = 'dashboard' | 'artists' | 'songs' | 'game' | 'tools' | 'danger';

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
  const [tab, setTab] = useState<Tab>('dashboard');
  const [turnDuration, setTurnDuration] = useState('');
  const [followerPlatform, setFollowerPlatform] = useState('spotify');
  const [followerCount, setFollowerCount] = useState('100000');
  const [analytics, setAnalytics] = useState<any>(null);
  const [renameValue, setRenameValue] = useState('');
  const [genreValue, setGenreValue] = useState('');
  const [setTurnValue, setSetTurnValue] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => { if (unlocked) fetchData(); }, [unlocked]);

  const fetchData = async () => {
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('*').order('total_streams', { ascending: false }).limit(200),
      supabase.from('songs').select('*, profiles!songs_artist_id_fkey(artist_name)').order('streams', { ascending: false }).limit(200),
    ]);
    if (a) setArtists(a as Profile[]);
    if (s) setSongs(s);
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('admin-actions', { body: { password, action: 'get_analytics' } });
      if (res.data?.analytics) setAnalytics(res.data.analytics);
    } catch {} finally { setLoading(false); }
  }, [password]);

  useEffect(() => { if (unlocked && tab === 'dashboard') fetchAnalytics(); }, [unlocked, tab, fetchAnalytics]);

  const callAdmin = async (action: string, extra: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('admin-actions', { body: { password, action, ...extra } });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;
      if (data?.error) toast.error(data.error);
      else { toast.success(data?.message || 'Done'); await fetchData(); if (action === 'delete_artist') setSelectedArtist(null); }
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('admin-actions', { body: { password, action: 'test' } });
      if (res.error) { toast.error('Wrong password'); setLoading(false); return; }
      setUnlocked(true); toast.success('Admin unlocked');
    } catch { toast.error('Connection error'); } finally { setLoading(false); }
  };

  const filtered = searchQuery ? artists.filter(a => a.artist_name.toLowerCase().includes(searchQuery.toLowerCase())) : artists;
  const artistSongs = selectedArtist ? songs.filter(s => s.artist_id === selectedArtist.id) : [];

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center"><Shield className="w-8 h-8" /></div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-[#888] mt-1">Enter password to continue</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlock()}
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

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'songs', label: 'Songs', icon: Music },
    { id: 'game', label: 'Game', icon: Clock },
    { id: 'tools', label: 'Tools', icon: Zap },
    { id: 'danger', label: 'Danger', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-500/20 to-transparent p-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-400" /><h1 className="text-xl font-bold">Admin Panel</h1></div>
          <div className="flex items-center gap-2 text-xs text-[#888]"><Clock className="w-3 h-3" /><span>T{gameState?.current_turn ?? 0} · {formatTimeLeft()}</span></div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-3 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#141414] text-[#888]'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="px-4">
        {/* ─── DASHBOARD ─── */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#888]">Analytics Overview</h2>
              <button onClick={fetchAnalytics} className="text-xs text-red-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh</button>
            </div>
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Artists', value: analytics.artists, icon: Users, color: 'blue' },
                    { label: 'Songs', value: analytics.songs, icon: Music, color: 'green' },
                    { label: 'Total Streams', value: formatNumber(analytics.totalStreams), icon: TrendingUp, color: 'purple' },
                    { label: 'Economy', value: formatMoney(analytics.totalMoney), icon: DollarSign, color: 'emerald' },
                    { label: 'Monthly Listeners', value: formatNumber(analytics.totalListeners), icon: Users, color: 'pink' },
                    { label: 'Avg Money/Artist', value: formatMoney(analytics.avgMoney), icon: Banknote, color: 'yellow' },
                    { label: 'Chart Entries', value: formatNumber(analytics.charts), icon: BarChart3, color: 'cyan' },
                    { label: 'Reviews', value: analytics.reviews, icon: Star, color: 'orange' },
                    { label: 'Stream History', value: formatNumber(analytics.streamHistory), icon: Database, color: 'indigo' },
                    { label: 'Concerts', value: analytics.concerts, icon: Mic2, color: 'rose' },
                    { label: 'Beefs', value: analytics.beefs, icon: Zap, color: 'amber' },
                    { label: 'Record Deals', value: analytics.deals, icon: Award, color: 'teal' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#141414] rounded-xl p-3 border border-[#222]">
                      <s.icon className={`w-4 h-4 text-${s.color}-400 mb-1`} />
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-[10px] text-[#888]">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analytics.topArtist && (
                    <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                      <p className="text-xs text-[#888] mb-1">🏆 Top Artist</p>
                      <p className="font-bold">{analytics.topArtist.name}</p>
                      <p className="text-xs text-[#888]">{formatNumber(analytics.topArtist.streams)} streams</p>
                    </div>
                  )}
                  {analytics.topSong && (
                    <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                      <p className="text-xs text-[#888] mb-1">🎵 Top Song</p>
                      <p className="font-bold">{analytics.topSong.title}</p>
                      <p className="text-xs text-[#888]">{formatNumber(analytics.topSong.streams)} streams</p>
                    </div>
                  )}
                  {analytics.gameState && (
                    <div className="bg-[#141414] rounded-xl p-4 border border-[#222] md:col-span-2">
                      <p className="text-xs text-[#888] mb-1">⏱️ Game State</p>
                      <div className="flex gap-6 text-sm">
                        <div><span className="text-[#888]">Turn:</span> <span className="font-bold">{analytics.gameState.current_turn}</span></div>
                        <div><span className="text-[#888]">Duration:</span> <span className="font-bold">{analytics.gameState.turn_duration_minutes}m</span></div>
                        <div><span className="text-[#888]">Next:</span> <span className="font-mono text-blue-400">{formatTimeLeft()}</span></div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Leaderboard */}
                <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Top 10 Artists</h3>
                  <div className="space-y-2">
                    {artists.slice(0, 10).map((a, i) => (
                      <div key={a.id} className="flex items-center gap-3 text-sm">
                        <span className={`w-5 text-right text-xs font-bold ${i < 3 ? 'text-yellow-400' : 'text-[#666]'}`}>{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                          {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-3 h-3 text-[#666] m-2" />}
                        </div>
                        <span className="flex-1 truncate text-xs">{a.artist_name}</span>
                        <span className="text-xs text-[#888]">{formatNumber(a.total_streams)}</span>
                        <span className="text-xs text-emerald-400">{formatMoney(a.current_money)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#888]"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /><p className="text-sm">Loading analytics...</p></div>
            )}
          </div>
        )}

        {/* ─── GAME ─── */}
        {tab === 'game' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Game State</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#888]">Current Turn</span><span className="font-bold">{gameState?.current_turn ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-[#888]">Duration</span><span className="font-bold">{gameState?.turn_duration_minutes ?? 0} min</span></div>
                <div className="flex justify-between"><span className="text-[#888]">Next Turn</span><span className="font-mono text-blue-400">{formatTimeLeft()}</span></div>
              </div>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Timer className="w-4 h-4 text-orange-400" /> Set Duration</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" value={turnDuration} onChange={e => setTurnDuration(e.target.value)} placeholder={String(gameState?.turn_duration_minutes || 60)}
                    className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500" />
                  <button onClick={() => callAdmin('set_turn_duration', { amount: parseInt(turnDuration) || 60 })} disabled={loading}
                    className="px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-medium disabled:opacity-50">Set</button>
                </div>
                <div className="flex gap-2">
                  {[15, 30, 60, 120].map(m => (
                    <button key={m} onClick={() => callAdmin('set_turn_duration', { amount: m })} disabled={loading}
                      className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg py-2 text-xs font-medium hover:border-orange-500/50 disabled:opacity-50">{m}m</button>
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
                <div className="flex gap-1">
                  <input type="number" value={setTurnValue} onChange={e => setSetTurnValue(e.target.value)} placeholder="Turn #"
                    className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-2 py-2 text-xs outline-none" />
                  <button onClick={() => callAdmin('set_turn', { amount: parseInt(setTurnValue) || 1 })} disabled={loading}
                    className="px-2 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-medium disabled:opacity-50">
                    <Hash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-400" /> Economy</h3>
              <div className="space-y-2">
                <input type="number" value={boostAmount} onChange={e => setBoostAmount(e.target.value)} placeholder="Amount"
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => callAdmin('give_money_all', { amount: parseInt(boostAmount) || 10000 })} disabled={loading}
                    className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                    <DollarSign className="w-3.5 h-3.5" /> Give All $
                  </button>
                  <button onClick={() => callAdmin('boost_all_streams', { amount: parseInt(boostAmount) || 50000 })} disabled={loading}
                    className="flex items-center justify-center gap-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                    <TrendingUp className="w-3.5 h-3.5" /> Boost All
                  </button>
                  <button onClick={() => { if (confirm('Reset all money?')) callAdmin('reset_economy'); }} disabled={loading}
                    className="col-span-2 flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Economy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ARTISTS ─── */}
        {tab === 'artists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2.5 mb-3">
                <Search className="w-4 h-4 text-[#666]" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search artists..."
                  className="bg-transparent text-sm placeholder-[#666] outline-none flex-1" />
                {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-[#666]" /></button>}
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filtered.map(a => (
                  <button key={a.id} onClick={() => { setSelectedArtist(a); setSelectedSong(null); }}
                    className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-colors ${selectedArtist?.id === a.id ? 'bg-red-500/20 border border-red-500/30' : 'bg-[#141414] hover:bg-[#1e1e1e]'}`}>
                    <div className="w-10 h-10 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                      {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-[#666] m-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.artist_name}</p>
                      <p className="text-xs text-[#888]">{formatNumber(a.total_streams)} · {formatMoney(a.current_money)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              {selectedArtist ? (
                <div className="space-y-3">
                  {/* Profile card */}
                  <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full bg-[#222] overflow-hidden flex-shrink-0">
                        {selectedArtist.avatar_url ? <img src={selectedArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-[#666] m-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{selectedArtist.artist_name}</p>
                        <p className="text-[10px] text-[#888]">{selectedArtist.genre || 'No genre'} · {formatMoney(selectedArtist.current_money)}</p>
                      </div>
                    </div>
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      {[
                        { label: 'Streams', value: formatNumber(selectedArtist.total_streams) },
                        { label: 'Monthly', value: formatNumber(selectedArtist.monthly_listeners) },
                        { label: 'Spotify', value: formatNumber(selectedArtist.spotify_followers) },
                        { label: 'Apple', value: formatNumber(selectedArtist.apple_music_listeners) },
                        { label: 'YouTube', value: formatNumber(selectedArtist.youtube_subscribers) },
                        { label: 'X', value: formatNumber(selectedArtist.x_followers) },
                      ].map(s => (
                        <div key={s.label} className="bg-[#0a0a0a] rounded-lg p-2">
                          <p className="text-xs font-bold">{s.value}</p>
                          <p className="text-[9px] text-[#888]">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Boost / Actions */}
                  <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                    <div className="mb-3">
                      <label className="text-xs text-[#888] mb-1 block">Amount</label>
                      <input type="number" value={boostAmount} onChange={e => setBoostAmount(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => callAdmin('boost_listeners', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <Users className="w-3.5 h-3.5" /> +Listeners
                      </button>
                      <button onClick={() => callAdmin('give_money', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <Banknote className="w-3.5 h-3.5" /> +Money
                      </button>
                      <button onClick={() => callAdmin('payola', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <DollarSign className="w-3.5 h-3.5" /> Payola
                      </button>
                      <button onClick={() => callAdmin('industry_plant', { artist_id: selectedArtist.id })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <Sprout className="w-3.5 h-3.5" /> Plant
                      </button>
                      <button onClick={() => callAdmin('multiply_stats', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) || 2 })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <Percent className="w-3.5 h-3.5" /> Multiply
                      </button>
                      <button onClick={() => callAdmin('set_money', { artist_id: selectedArtist.id, amount: parseInt(boostAmount) || 0 })} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <DollarSign className="w-3.5 h-3.5" /> Set $
                      </button>
                    </div>
                  </div>

                  {/* Set Followers */}
                  <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                    <h3 className="text-xs font-bold mb-2 flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-pink-400" /> Set Followers</h3>
                    <div className="flex gap-2">
                      <select value={followerPlatform} onChange={e => setFollowerPlatform(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#333] rounded-lg px-2 py-2 text-xs outline-none">
                        <option value="spotify">Spotify</option><option value="apple">Apple</option><option value="youtube">YouTube</option><option value="x">X</option><option value="monthly">Monthly</option>
                      </select>
                      <input type="number" value={followerCount} onChange={e => setFollowerCount(e.target.value)} className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-2 py-2 text-xs outline-none" />
                      <button onClick={() => callAdmin('set_followers', { artist_id: selectedArtist.id, platform: followerPlatform, count: parseInt(followerCount) || 0 })} disabled={loading}
                        className="px-3 py-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg text-xs font-medium disabled:opacity-50">Set</button>
                    </div>
                  </div>

                  {/* Rename / Genre */}
                  <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                    <h3 className="text-xs font-bold mb-2 flex items-center gap-2"><PenLine className="w-3.5 h-3.5 text-cyan-400" /> Edit Profile</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input value={renameValue} onChange={e => setRenameValue(e.target.value)} placeholder="New name"
                          className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-xs outline-none" />
                        <button onClick={() => { callAdmin('rename_artist', { artist_id: selectedArtist.id, name: renameValue }); setRenameValue(''); }} disabled={loading || !renameValue}
                          className="px-3 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium disabled:opacity-50">Rename</button>
                      </div>
                      <div className="flex gap-2">
                        <input value={genreValue} onChange={e => setGenreValue(e.target.value)} placeholder="Genre"
                          className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-xs outline-none" />
                        <button onClick={() => { callAdmin('set_genre', { artist_id: selectedArtist.id, genre: genreValue }); setGenreValue(''); }} disabled={loading || !genreValue}
                          className="px-3 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium disabled:opacity-50">Set</button>
                      </div>
                    </div>
                  </div>

                  {/* Danger zone for artist */}
                  <div className="bg-[#141414] rounded-xl p-4 border border-red-500/20">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { if (confirm('Ban this artist?')) callAdmin('ban_artist', { artist_id: selectedArtist.id }); }} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <Ban className="w-3.5 h-3.5" /> Ban
                      </button>
                      <button onClick={() => { if (confirm(`Delete ${selectedArtist.artist_name}?`)) callAdmin('delete_artist', { artist_id: selectedArtist.id }); }} disabled={loading}
                        className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2 text-xs font-medium disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Songs */}
                  <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
                    <h3 className="text-xs font-bold mb-2 flex items-center gap-2"><Mic2 className="w-3.5 h-3.5 text-red-400" /> Songs ({artistSongs.length})</h3>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {artistSongs.map((s: any) => (
                        <button key={s.id} onClick={() => setSelectedSong(s)}
                          className={`flex items-center gap-3 w-full text-left p-2 rounded-lg ${selectedSong?.id === s.id ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-[#0a0a0a] hover:bg-[#1e1e1e]'}`}>
                          <div className="w-8 h-8 rounded bg-[#222] overflow-hidden flex-shrink-0">
                            {s.cover_url ? <img src={s.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-3 h-3 text-[#666] m-2.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{s.title}</p>
                            <p className="text-[10px] text-[#888]">{formatNumber(s.streams)} streams</p>
                          </div>
                        </button>
                      ))}
                      {artistSongs.length === 0 && <p className="text-xs text-[#888]">No songs</p>}
                    </div>
                    {selectedSong && (
                      <div className="mt-3 pt-3 border-t border-[#222] grid grid-cols-3 gap-2">
                        <button onClick={() => callAdmin('boost_streams', { song_id: selectedSong.id, amount: parseInt(boostAmount) })} disabled={loading}
                          className="flex items-center justify-center gap-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg py-2 text-[10px] font-medium disabled:opacity-50">
                          <TrendingUp className="w-3 h-3" /> Boost
                        </button>
                        <button onClick={() => callAdmin('chart_placement', { song_id: selectedSong.id, amount: 1 })} disabled={loading}
                          className="flex items-center justify-center gap-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg py-2 text-[10px] font-medium disabled:opacity-50">
                          <BarChart3 className="w-3 h-3" /> #1
                        </button>
                        <button onClick={() => { if (confirm('Delete song?')) callAdmin('delete_song', { song_id: selectedSong.id }); }} disabled={loading}
                          className="flex items-center justify-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-2 text-[10px] font-medium disabled:opacity-50">
                          <Trash2 className="w-3 h-3" /> Del
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#141414] rounded-xl p-8 border border-[#222] text-center">
                  <Users className="w-8 h-8 text-[#444] mx-auto mb-3" />
                  <p className="text-sm text-[#888]">Select an artist</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SONGS ─── */}
        {tab === 'songs' && (
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-3">All Songs ({songs.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto">
              {songs.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 bg-[#141414] rounded-lg p-3">
                  <div className="w-10 h-10 rounded bg-[#222] overflow-hidden flex-shrink-0">
                    {s.cover_url ? <img src={s.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#666] m-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{s.title}</p>
                    <p className="text-[10px] text-[#888]">{s.profiles?.artist_name || '?'} · {formatNumber(s.streams)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedArtist(artists.find(a => a.id === s.artist_id) || null); setSelectedSong(s); setTab('artists'); }}
                      className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Edit</button>
                    <button onClick={() => { if (confirm('Delete?')) callAdmin('delete_song', { song_id: s.id }); }}
                      className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TOOLS ─── */}
        {tab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Bulk Operations</h3>
              <div className="space-y-2">
                <div className="mb-2">
                  <label className="text-xs text-[#888] mb-1 block">Amount</label>
                  <input type="number" value={boostAmount} onChange={e => setBoostAmount(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2 text-sm outline-none" />
                </div>
                <button onClick={() => callAdmin('boost_all_streams', { amount: parseInt(boostAmount) })} disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                  <TrendingUp className="w-3.5 h-3.5" /> Boost All Streams
                </button>
                <button onClick={() => callAdmin('give_money_all', { amount: parseInt(boostAmount) })} disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg py-2.5 text-xs font-medium disabled:opacity-50">
                  <DollarSign className="w-3.5 h-3.5" /> Give All Money
                </button>
              </div>
            </div>
            <div className="bg-[#141414] rounded-xl p-4 border border-[#222]">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Rocket className="w-4 h-4 text-green-400" /> System</h3>
              <div className="space-y-2">
                <button onClick={() => {
                  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-turn`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }
                  }).then(() => toast.success('Turn processed!')).catch(() => toast.error('Failed'));
                }} className="w-full flex items-center justify-center gap-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2.5 text-xs font-medium">
                  <Rocket className="w-3.5 h-3.5" /> Force Process Turn
                </button>
                <button onClick={fetchAnalytics} className="w-full flex items-center justify-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-2.5 text-xs font-medium">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
                </button>
                <button onClick={fetchData} className="w-full flex items-center justify-center gap-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg py-2.5 text-xs font-medium">
                  <Database className="w-3.5 h-3.5" /> Reload Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── DANGER ZONE ─── */}
        {tab === 'danger' && (
          <div className="space-y-3">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
              </div>
              <p className="text-xs text-[#888] mb-4">These actions are destructive and cannot be undone.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button onClick={() => { if (confirm('Reset ALL money to starting amounts?')) callAdmin('reset_economy'); }} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-3 text-xs font-medium disabled:opacity-50">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Economy
                </button>
                <button onClick={() => { if (confirm('Reset ALL streams to 0?')) callAdmin('reset_all_streams'); }} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-3 text-xs font-medium disabled:opacity-50">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset All Streams
                </button>
                <button onClick={() => { if (confirm('Wipe ALL chart data?')) callAdmin('nuke_charts'); }} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-3 text-xs font-medium disabled:opacity-50">
                  <Bomb className="w-3.5 h-3.5" /> Nuke Charts
                </button>
                <button onClick={() => { if (confirm('Wipe ALL stream history?')) callAdmin('nuke_stream_history'); }} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-3 text-xs font-medium disabled:opacity-50">
                  <Bomb className="w-3.5 h-3.5" /> Nuke Stream History
                </button>
                <button onClick={() => { if (confirm('Wipe ALL Pitchfork reviews?')) callAdmin('nuke_reviews'); }} disabled={loading}
                  className="flex items-center justify-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-3 text-xs font-medium disabled:opacity-50 md:col-span-2">
                  <Bomb className="w-3.5 h-3.5" /> Nuke Reviews
                </button>
              </div>
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
