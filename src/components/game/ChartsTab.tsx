import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Profile } from '@/hooks/useProfile';
import { BarChart3, TrendingUp, Music, Radio, Flame, Users, Crown } from 'lucide-react';

type ChartType = 'hot_100_daily' | 'hot_100_weekly' | 'daily_radio' | 'weekly_radio' | 'monthly_listeners' | 'top_songs';

const CHART_CONFIGS: { type: ChartType; label: string; icon: any; unit: string }[] = [
  { type: 'hot_100_daily', label: 'Hot 100 Daily', icon: Flame, unit: 'streams' },
  { type: 'hot_100_weekly', label: 'Hot 100 Weekly', icon: Flame, unit: 'streams' },
  { type: 'daily_radio', label: 'Daily Radio', icon: Radio, unit: 'spins' },
  { type: 'weekly_radio', label: 'Weekly Radio', icon: Radio, unit: 'spins' },
  { type: 'monthly_listeners', label: 'Monthly Listeners', icon: Users, unit: 'listeners' },
  { type: 'top_songs', label: 'Top Songs', icon: Crown, unit: 'streams' },
];

export default function ChartsTab() {
  const [chartType, setChartType] = useState<ChartType>('hot_100_daily');
  const [artists, setArtists] = useState<Profile[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('total_streams', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setArtists(data as Profile[]); });

    supabase.from('songs').select('*, profiles!songs_artist_id_fkey(artist_name, avatar_url)').order('streams', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setSongs(data); });
  }, []);

  useEffect(() => {
    const fetchChartData = async () => {
      // Get the latest turn's chart data for selected type
      const { data } = await supabase
        .from('charts')
        .select('*, profiles!charts_artist_id_fkey(artist_name, avatar_url), songs!charts_song_id_fkey(title, cover_url)')
        .eq('chart_type', chartType)
        .order('position', { ascending: true })
        .limit(50);
      if (data) setChartData(data);
    };
    fetchChartData();
  }, [chartType]);

  const config = CHART_CONFIGS.find(c => c.type === chartType)!;
  const isArtistChart = chartType === 'monthly_listeners';

  // Fallback to direct queries if no chart data exists yet
  const displayData = chartData.length > 0 ? chartData : [];
  const fallbackArtists = isArtistChart ? artists : [];
  const fallbackSongs = !isArtistChart ? songs : [];

  const hasFallback = displayData.length === 0 && (fallbackArtists.length > 0 || fallbackSongs.length > 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Charts</h2>
      </div>

      {/* Chart type selector - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CHART_CONFIGS.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.type}
              onClick={() => setChartType(c.type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                chartType === c.type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Chart entries */}
      <div className="space-y-2">
        {displayData.length > 0 ? (
          displayData.map((entry: any, i: number) => {
            const isArtist = isArtistChart;
            const name = isArtist
              ? entry.profiles?.artist_name || 'Unknown'
              : entry.songs?.title || 'Unknown';
            const subtitle = isArtist
              ? `${formatNumber(entry.streams)} ${config.unit}`
              : `${entry.profiles?.artist_name || 'Unknown'} • ${formatNumber(entry.streams)} ${config.unit}`;
            const imageUrl = isArtist ? entry.profiles?.avatar_url : entry.songs?.cover_url;
            const maxStreams = Math.max(...displayData.map((d: any) => d.streams), 1);

            return (
              <div key={entry.id} className="glass-card p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-display font-bold text-primary w-8 text-center">
                    {entry.position || i + 1}
                  </span>
                  <div className={`w-10 h-10 ${isArtist ? 'rounded-full' : 'rounded'} bg-secondary overflow-hidden flex-shrink-0`}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="chart-bar h-full"
                    style={{ width: `${(entry.streams / maxStreams) * 100}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : hasFallback ? (
          // Fallback: show data directly from tables
          isArtistChart ? fallbackArtists.map((artist, i) => {
            const maxStreams = Math.max(...fallbackArtists.map(a => a.monthly_listeners), 1);
            return (
              <div key={artist.id} className="glass-card p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-display font-bold text-primary w-8 text-center">{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{artist.artist_name}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(artist.monthly_listeners)} listeners</p>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="chart-bar h-full" style={{ width: `${(artist.monthly_listeners / maxStreams) * 100}%` }} />
                </div>
              </div>
            );
          }) : fallbackSongs.map((song: any, i: number) => {
            const maxStreams = Math.max(...fallbackSongs.map((s: any) => s.streams), 1);
            return (
              <div key={song.id} className="glass-card p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-display font-bold text-primary w-8 text-center">{i + 1}</span>
                  <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {song.profiles?.artist_name} • {formatNumber(song.streams)} streams
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="chart-bar h-full" style={{ width: `${(song.streams / maxStreams) * 100}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No chart data yet. Release music to climb the charts!</p>
          </div>
        )}
      </div>
    </div>
  );
}
