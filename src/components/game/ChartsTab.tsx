import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Profile } from '@/hooks/useProfile';
import { BarChart3, TrendingUp, Music } from 'lucide-react';

type ChartType = 'artists' | 'songs';

export default function ChartsTab() {
  const [chartType, setChartType] = useState<ChartType>('artists');
  const [artists, setArtists] = useState<Profile[]>([]);
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('total_streams', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setArtists(data as Profile[]); });
    
    supabase.from('songs').select('*, profiles!songs_artist_id_fkey(artist_name, avatar_url)').order('streams', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setSongs(data); });
  }, []);

  const maxStreams = chartType === 'artists'
    ? Math.max(...artists.map(a => a.total_streams), 1)
    : Math.max(...songs.map(s => s.streams), 1);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Charts</h2>
      </div>

      {/* Chart type toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setChartType('artists')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            chartType === 'artists' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          }`}
        >
          Top Artists
        </button>
        <button
          onClick={() => setChartType('songs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            chartType === 'songs' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          }`}
        >
          Top Songs
        </button>
      </div>

      {/* Chart bars */}
      <div className="space-y-3">
        {chartType === 'artists' ? (
          artists.length > 0 ? artists.map((artist, i) => (
            <div key={artist.id} className="glass-card p-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-display font-bold text-primary w-8 text-center">
                  {i + 1}
                </span>
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
                  <p className="text-xs text-muted-foreground">{formatNumber(artist.total_streams)} streams</p>
                </div>
              </div>
              {/* Bar */}
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="chart-bar h-full"
                  style={{ width: `${(artist.total_streams / maxStreams) * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No chart data yet. Release music to climb the charts!</p>
            </div>
          )
        ) : (
          songs.length > 0 ? songs.map((song: any, i: number) => (
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
                <div
                  className="chart-bar h-full"
                  style={{ width: `${(song.streams / maxStreams) * 100}%` }}
                />
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No songs on the charts yet</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
