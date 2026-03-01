import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Profile } from '@/hooks/useProfile';
import { BarChart3, Music, Radio, Users, Crown, ChevronUp, ChevronDown, Minus, Disc3, Flame, Headphones, Mic2, Guitar, Waves, Zap, Globe } from 'lucide-react';

type ChartType = 'hot_100_daily' | 'hot_100_weekly' | 'daily_radio' | 'weekly_radio' | 'monthly_listeners' | 'top_songs' | 'hip_hop' | 'pop' | 'rnb' | 'rock' | 'latin' | 'global';

const CHART_CONFIGS: { type: ChartType; label: string; icon: any; unit: string; genre?: boolean }[] = [
  { type: 'hot_100_daily', label: 'Hot 100', icon: Flame, unit: 'streams' },
  { type: 'hot_100_weekly', label: 'Weekly', icon: Crown, unit: 'streams' },
  { type: 'top_songs', label: 'Top Songs', icon: Music, unit: 'streams' },
  { type: 'daily_radio', label: 'Radio', icon: Radio, unit: 'spins' },
  { type: 'monthly_listeners', label: 'Listeners', icon: Users, unit: 'listeners' },
  { type: 'hip_hop', label: 'Hip-Hop', icon: Mic2, unit: 'streams', genre: true },
  { type: 'pop', label: 'Pop', icon: Zap, unit: 'streams', genre: true },
  { type: 'rnb', label: 'R&B', icon: Waves, unit: 'streams', genre: true },
  { type: 'rock', label: 'Rock', icon: Guitar, unit: 'streams', genre: true },
  { type: 'latin', label: 'Latin', icon: Headphones, unit: 'streams', genre: true },
  { type: 'global', label: 'Global', icon: Globe, unit: 'streams', genre: true },
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
    const config = CHART_CONFIGS.find(c => c.type === chartType);
    if (config?.genre) {
      // Genre charts use fallback data filtered by genre
      setChartData([]);
      setPrevChartData([]);
      return;
    }

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
  const isGenreChart = config.genre;
  const displayData = chartData.length > 0 ? chartData : [];
  const showCount = expanded ? displayData.length : Math.min(20, displayData.length);

  const getMovement = (entry: ChartEntry) => {
    const key = isArtistChart ? entry.artist_id : entry.song_id;
    const prev = prevChartData.find(p => isArtistChart ? p.artist_id === key : p.song_id === key);
    if (!prev) return { type: 'new' as const, diff: 0 };
    const diff = prev.position - entry.position;
    if (diff > 0) return { type: 'up' as const, diff };
    if (diff < 0) return { type: 'down' as const, diff: Math.abs(diff) };
    return { type: 'same' as const, diff: 0 };
  };

  // Genre charts show filtered songs by genre name matching
  const genreFilteredSongs = isGenreChart
    ? songs.filter((s: any) => {
        const artistGenre = (s.profiles?.genre || 'Pop').toLowerCase();
        const target = chartType === 'rnb' ? 'r&b' : chartType;
        return artistGenre.includes(target) || (chartType === 'global');
      }).slice(0, 20)
    : [];

  const fallbackArtists = isArtistChart ? artists : [];
  const fallbackSongs = !isArtistChart && !isGenreChart ? songs : [];
  const hasFallback = displayData.length === 0 && (fallbackArtists.length > 0 || fallbackSongs.length > 0 || genreFilteredSongs.length > 0);

  const mainCharts = CHART_CONFIGS.filter(c => !c.genre);
  const genreCharts = CHART_CONFIGS.filter(c => c.genre);

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground hollow-icon" strokeWidth={1.5} />
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Charts</h2>
        </div>
        <span className="text-[10px] text-muted-foreground mono">Turn {currentTurn}</span>
      </div>

      {/* Main chart types */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {mainCharts.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.type} onClick={() => setChartType(c.type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-medium transition-all whitespace-nowrap border ${
                chartType === c.type
                  ? 'border-foreground/40 text-foreground bg-foreground/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3 h-3 hollow-icon" strokeWidth={1.5} />{c.label}
            </button>
          );
        })}
      </div>

      {/* Genre charts */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {genreCharts.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.type} onClick={() => setChartType(c.type)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-medium transition-all whitespace-nowrap border ${
                chartType === c.type
                  ? 'border-foreground/40 text-foreground bg-foreground/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-3 h-3 hollow-icon" strokeWidth={1.5} />{c.label}
            </button>
          );
        })}
      </div>

      {/* Chart header */}
      <div className="flex items-center justify-between text-[9px] text-muted-foreground px-1 uppercase tracking-widest mono">
        <span>#</span>
        <span className="flex-1 ml-14">{isArtistChart ? 'Artist' : 'Title'}</span>
        <span>{config.unit}</span>
      </div>

      {/* Chart entries */}
      <div className="space-y-1">
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
                <div key={entry.id} className={`rounded-lg transition-all p-2.5 ${isTop3 ? 'bg-foreground/[0.03] border border-foreground/10' : 'glass-card'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 text-center mono text-sm font-bold ${isTop3 ? 'text-foreground' : 'text-muted-foreground'}`}>{pos}</span>

                    {/* Movement */}
                    <div className="w-4 flex-shrink-0 text-center">
                      {movement.type === 'up' && <ChevronUp className="w-3 h-3 text-foreground/70 mx-auto" />}
                      {movement.type === 'down' && <ChevronDown className="w-3 h-3 text-muted-foreground/50 mx-auto" />}
                      {movement.type === 'same' && <Minus className="w-2.5 h-2.5 text-muted-foreground/30 mx-auto" />}
                      {movement.type === 'new' && <span className="text-[8px] font-bold text-foreground/60 mono">NEW</span>}
                    </div>

                    {/* Image */}
                    <div className={`w-8 h-8 ${isArtist ? 'rounded-full' : 'rounded'} bg-muted overflow-hidden flex-shrink-0`}>
                      {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center"><Music className="w-3 h-3 text-muted-foreground hollow-icon" strokeWidth={1.5} /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{name}</p>
                      {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
                    </div>

                    <span className="text-xs mono font-medium">{formatNumber(entry.streams)}</span>
                  </div>

                  {/* Minimal bar */}
                  <div className="h-[1px] bg-border/30 mt-2">
                    <div className="h-full bg-foreground/30 transition-all duration-500" style={{ width: `${(entry.streams / maxStreams) * 100}%` }} />
                  </div>
                </div>
              );
            })}

            {displayData.length > 20 && (
              <button onClick={() => setExpanded(!expanded)}
                className="w-full text-center py-2 text-[10px] text-muted-foreground font-medium hover:text-foreground transition-colors mono">
                {expanded ? 'Show Less' : `Show All ${displayData.length}`}
              </button>
            )}
          </>
        ) : hasFallback ? (
          isGenreChart ? (
            genreFilteredSongs.length > 0 ? genreFilteredSongs.map((song: any, i: number) => {
              const maxStreams = Math.max(...genreFilteredSongs.map((s: any) => s.streams), 1);
              return (
                <div key={song.id} className="glass-card p-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-center mono text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <div className="w-4" />
                    <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                      {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-3 h-3 text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{song.title}</p>
                      <p className="text-[10px] text-muted-foreground">{song.profiles?.artist_name}</p>
                    </div>
                    <span className="text-xs mono">{formatNumber(song.streams)}</span>
                  </div>
                  <div className="h-[1px] bg-border/30 mt-2">
                    <div className="h-full bg-foreground/20" style={{ width: `${(song.streams / maxStreams) * 100}%` }} />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-xs">No {config.label} chart data yet</p>
              </div>
            )
          ) : isArtistChart ? fallbackArtists.slice(0, 20).map((artist, i) => {
            const maxStreams = Math.max(...fallbackArtists.map(a => a.monthly_listeners), 1);
            return (
              <div key={artist.id} className="glass-card p-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 text-center mono text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <div className="w-4" />
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-3 h-3 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{artist.artist_name}</p>
                  </div>
                  <span className="text-xs mono">{formatNumber(artist.monthly_listeners)}</span>
                </div>
                <div className="h-[1px] bg-border/30 mt-2">
                  <div className="h-full bg-foreground/20" style={{ width: `${(artist.monthly_listeners / maxStreams) * 100}%` }} />
                </div>
              </div>
            );
          }) : fallbackSongs.slice(0, 20).map((song: any, i: number) => {
            const maxStreams = Math.max(...fallbackSongs.map((s: any) => s.streams), 1);
            return (
              <div key={song.id} className="glass-card p-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 text-center mono text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <div className="w-4" />
                  <div className="w-8 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                    {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-3 h-3 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{song.title}</p>
                    <p className="text-[10px] text-muted-foreground">{song.profiles?.artist_name}</p>
                  </div>
                  <span className="text-xs mono">{formatNumber(song.streams)}</span>
                </div>
                <div className="h-[1px] bg-border/30 mt-2">
                  <div className="h-full bg-foreground/20" style={{ width: `${(song.streams / maxStreams) * 100}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Disc3 className="w-8 h-8 mx-auto mb-3 opacity-30 animate-spin hollow-icon" strokeWidth={1.5} style={{ animationDuration: '3s' }} />
            <p className="text-xs">No chart data yet</p>
            <p className="text-[10px] mt-1 text-muted-foreground/50">Release music to climb the charts</p>
          </div>
        )}
      </div>
    </div>
  );
}
