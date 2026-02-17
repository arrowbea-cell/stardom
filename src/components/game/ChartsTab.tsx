import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Profile } from '@/hooks/useProfile';
import { BarChart3, TrendingUp, TrendingDown, Minus, Music, Radio, Flame, Users, Crown, ChevronUp, ChevronDown, Trophy, Disc3 } from 'lucide-react';

type ChartType = 'hot_100_daily' | 'hot_100_weekly' | 'daily_radio' | 'weekly_radio' | 'monthly_listeners' | 'top_songs';

const CHART_CONFIGS: { type: ChartType; label: string; icon: any; unit: string; color: string }[] = [
  { type: 'hot_100_daily', label: 'Hot 100 Daily', icon: Flame, unit: 'streams', color: 'from-orange-500 to-red-500' },
  { type: 'hot_100_weekly', label: 'Hot 100 Weekly', icon: Flame, unit: 'streams', color: 'from-red-500 to-pink-500' },
  { type: 'top_songs', label: 'Top Songs', icon: Crown, unit: 'streams', color: 'from-yellow-500 to-amber-500' },
  { type: 'daily_radio', label: 'Daily Radio', icon: Radio, unit: 'spins', color: 'from-blue-500 to-cyan-500' },
  { type: 'weekly_radio', label: 'Weekly Radio', icon: Radio, unit: 'spins', color: 'from-indigo-500 to-blue-500' },
  { type: 'monthly_listeners', label: 'Monthly Listeners', icon: Users, unit: 'listeners', color: 'from-green-500 to-emerald-500' },
];

interface ChartEntry {
  id: string;
  position: number;
  streams: number;
  turn_number: number;
  chart_type: string;
  artist_id: string;
  song_id: string | null;
  profiles?: { artist_name: string; avatar_url: string | null };
  songs?: { title: string; cover_url: string | null };
}

export default function ChartsTab() {
  const [chartType, setChartType] = useState<ChartType>('hot_100_daily');
  const [artists, setArtists] = useState<Profile[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [prevChartData, setPrevChartData] = useState<ChartEntry[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').order('total_streams', { ascending: false }).limit(50),
      supabase.from('songs').select('*, profiles!songs_artist_id_fkey(artist_name, avatar_url)').order('streams', { ascending: false }).limit(50),
      supabase.from('game_state').select('current_turn').limit(1).single(),
    ]).then(([{ data: a }, { data: s }, { data: gs }]) => {
      if (a) setArtists(a as Profile[]);
      if (s) setSongs(s);
      if (gs) setCurrentTurn(gs.current_turn);
    });
  }, []);

  useEffect(() => {
    const fetchChartData = async () => {
      const { data: latestEntry } = await supabase
        .from('charts').select('turn_number').eq('chart_type', chartType)
        .order('turn_number', { ascending: false }).limit(1).maybeSingle();

      if (!latestEntry) { setChartData([]); setPrevChartData([]); return; }

      const [{ data: current }, { data: prev }] = await Promise.all([
        supabase.from('charts')
          .select('*, profiles!charts_artist_id_fkey(artist_name, avatar_url), songs!charts_song_id_fkey(title, cover_url)')
          .eq('chart_type', chartType).eq('turn_number', latestEntry.turn_number)
          .order('position', { ascending: true }).limit(100),
        supabase.from('charts')
          .select('*, profiles!charts_artist_id_fkey(artist_name, avatar_url), songs!charts_song_id_fkey(title, cover_url)')
          .eq('chart_type', chartType).eq('turn_number', latestEntry.turn_number - 1)
          .order('position', { ascending: true }).limit(100),
      ]);

      if (current) setChartData(current as ChartEntry[]);
      if (prev) setPrevChartData(prev as ChartEntry[]);
    };
    fetchChartData();
  }, [chartType]);

  const config = CHART_CONFIGS.find(c => c.type === chartType)!;
  const isArtistChart = chartType === 'monthly_listeners';
  const displayData = chartData.length > 0 ? chartData : [];
  const showCount = expanded ? displayData.length : Math.min(20, displayData.length);

  // Calculate position change
  const getMovement = (entry: ChartEntry) => {
    const key = isArtistChart ? entry.artist_id : entry.song_id;
    const prev = prevChartData.find(p => isArtistChart ? p.artist_id === key : p.song_id === key);
    if (!prev) return { type: 'new' as const, diff: 0 };
    const diff = prev.position - entry.position;
    if (diff > 0) return { type: 'up' as const, diff };
    if (diff < 0) return { type: 'down' as const, diff: Math.abs(diff) };
    return { type: 'same' as const, diff: 0 };
  };

  // Fallback data
  const fallbackArtists = isArtistChart ? artists : [];
  const fallbackSongs = !isArtistChart ? songs : [];
  const hasFallback = displayData.length === 0 && (fallbackArtists.length > 0 || fallbackSongs.length > 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Charts</h2>
        </div>
        <span className="text-xs text-muted-foreground">Turn {currentTurn}</span>
      </div>

      {/* Chart type selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CHART_CONFIGS.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.type} onClick={() => setChartType(c.type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                chartType === c.type
                  ? `bg-gradient-to-r ${c.color} text-white shadow-lg`
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}>
              <Icon className="w-3.5 h-3.5" />{c.label}
            </button>
          );
        })}
      </div>

      {/* Chart header bar */}
      {displayData.length > 0 && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2 uppercase tracking-wider">
          <span>#</span>
          <span className="flex-1 ml-14">{isArtistChart ? 'Artist' : 'Title'}</span>
          <span>{config.unit}</span>
        </div>
      )}

      {/* Chart entries */}
      <div className="space-y-1.5">
        {displayData.length > 0 ? (
          <>
            {displayData.slice(0, showCount).map((entry, i) => {
              const movement = getMovement(entry);
              const isArtist = isArtistChart;
              const name = isArtist ? entry.profiles?.artist_name || 'Unknown' : entry.songs?.title || 'Unknown';
              const subtitle = isArtist ? '' : entry.profiles?.artist_name || 'Unknown';
              const imageUrl = isArtist ? entry.profiles?.avatar_url : entry.songs?.cover_url;
              const maxStreams = Math.max(...displayData.map(d => d.streams), 1);
              const pos = entry.position || i + 1;
              const isTop3 = pos <= 3;

              return (
                <div key={entry.id} className={`rounded-xl transition-all ${isTop3 ? 'bg-gradient-to-r from-[hsl(var(--primary)/0.1)] to-transparent border border-primary/20 p-3' : 'glass-card p-3'}`}>
                  <div className="flex items-center gap-3">
                    {/* Position */}
                    <div className="w-8 text-center flex-shrink-0">
                      <span className={`text-lg font-display font-black ${isTop3 ? 'text-primary' : 'text-muted-foreground'}`}>{pos}</span>
                    </div>

                    {/* Movement indicator */}
                    <div className="w-5 flex-shrink-0 text-center">
                      {movement.type === 'up' && (
                        <div className="flex items-center justify-center text-green-400" title={`Up ${movement.diff}`}>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold">{movement.diff}</span>
                        </div>
                      )}
                      {movement.type === 'down' && (
                        <div className="flex items-center justify-center text-red-400" title={`Down ${movement.diff}`}>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold">{movement.diff}</span>
                        </div>
                      )}
                      {movement.type === 'same' && <Minus className="w-3 h-3 text-muted-foreground mx-auto" />}
                      {movement.type === 'new' && <span className="text-[9px] font-bold text-blue-400">NEW</span>}
                    </div>

                    {/* Image */}
                    <div className={`w-10 h-10 ${isArtist ? 'rounded-full' : 'rounded'} bg-secondary overflow-hidden flex-shrink-0`}>
                      {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isTop3 ? 'text-foreground' : ''}`}>{name}</p>
                      {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">{formatNumber(entry.streams)}</p>
                      <p className="text-[10px] text-muted-foreground">{config.unit}</p>
                    </div>

                    {/* Trophy for #1 */}
                    {pos === 1 && <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                    <div className={`h-full rounded-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                      style={{ width: `${(entry.streams / maxStreams) * 100}%` }} />
                  </div>
                </div>
              );
            })}

            {/* Show more/less */}
            {displayData.length > 20 && (
              <button onClick={() => setExpanded(!expanded)}
                className="w-full text-center py-3 text-xs text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors">
                {expanded ? `Show Less ▲` : `Show All ${displayData.length} ▼`}
              </button>
            )}
          </>
        ) : hasFallback ? (
          isArtistChart ? fallbackArtists.slice(0, 20).map((artist, i) => {
            const maxStreams = Math.max(...fallbackArtists.map(a => a.monthly_listeners), 1);
            return (
              <div key={artist.id} className="glass-card p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-display font-bold text-primary w-8 text-center">{i + 1}</span>
                  <div className="w-5" />
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{artist.artist_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatNumber(artist.monthly_listeners)}</p>
                    <p className="text-[10px] text-muted-foreground">listeners</p>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full bg-gradient-to-r ${config.color}`} style={{ width: `${(artist.monthly_listeners / maxStreams) * 100}%` }} />
                </div>
              </div>
            );
          }) : fallbackSongs.slice(0, 20).map((song: any, i: number) => {
            const maxStreams = Math.max(...fallbackSongs.map((s: any) => s.streams), 1);
            return (
              <div key={song.id} className="glass-card p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-display font-bold text-primary w-8 text-center">{i + 1}</span>
                  <div className="w-5" />
                  <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                    {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.profiles?.artist_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatNumber(song.streams)}</p>
                    <p className="text-[10px] text-muted-foreground">streams</p>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full bg-gradient-to-r ${config.color}`} style={{ width: `${(song.streams / maxStreams) * 100}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Disc3 className="w-10 h-10 mx-auto mb-3 opacity-50 animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-sm font-medium">No chart data yet</p>
            <p className="text-xs mt-1">Release music to climb the charts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
