import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Home, Search, Library, Play, Pause, Music, User, SkipBack, SkipForward, ChevronLeft, MoreHorizontal, TrendingUp, Radio, BarChart3, Shuffle, Heart, X } from 'lucide-react';

interface Props {
  profile: Profile;
}

interface Song {
  id: string;
  title: string;
  cover_url: string | null;
  streams: number;
  artist_id: string;
  radio_spins: number;
}

type Section = 'home' | 'search' | 'library' | 'artist' | 'charts';

export default function YouTubeMusicApp({ profile }: Props) {
  const [section, setSection] = useState<Section>('home');
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [allSongs, setAllSongs] = useState<(Song & { artist_name: string })[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<(Song & { artist_name?: string }) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [chartType, setChartType] = useState<'trending' | 'top_songs' | 'top_artists' | 'top_music_videos'>('trending');

  useEffect(() => {
    supabase.from('profiles').select('*').order('youtube_subscribers', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
  }, []);

  useEffect(() => {
    if (allArtists.length === 0) return;
    supabase.from('songs').select('*').order('streams', { ascending: false }).limit(50)
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((s: any) => {
            const artist = allArtists.find(a => a.id === s.artist_id);
            return { ...s, artist_name: artist?.artist_name || 'Unknown' };
          });
          setAllSongs(mapped);
        }
      });
  }, [allArtists]);

  useEffect(() => {
    supabase.from('songs').select('*').eq('artist_id', viewingArtist.id).order('streams', { ascending: false })
      .then(({ data }) => { if (data) setArtistSongs(data as Song[]); });
  }, [viewingArtist.id]);

  const openArtist = (a: Profile) => { setViewingArtist(a); setSection('artist'); };
  const playSong = (song: Song & { artist_name?: string }) => { setCurrentlyPlaying(song); setIsPlaying(true); };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('artist_name', `%${q}%`).limit(10);
    if (data) setSearchResults(data as Profile[]);
  };

  const chartSongs = chartType === 'top_artists' ? [] : [...allSongs].sort((a, b) => b.streams - a.streams);
  const chartArtists = chartType === 'top_artists' ? [...allArtists].sort((a, b) => b.youtube_subscribers - a.youtube_subscribers) : [];

  return (
    <div className="flex flex-col h-[calc(100vh-44px)] bg-[#030303] text-white">
      
      <div className="flex-1 overflow-y-auto">
      {/* HOME */}
      {section === 'home' && (
        <div>
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#030303] px-4 pt-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-5 bg-[#ff0000] rounded-sm flex items-center justify-center">
                  <Music className="w-3 h-3 text-white" />
                </div>
                <span className="text-lg font-semibold">Music</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSection('search')}><Search className="w-5 h-5 text-[#aaa]" /></button>
                <div className="w-7 h-7 rounded-full bg-[#272727] overflow-hidden">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-[#aaa] m-1.5" />}
                </div>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['Energize', 'Relax', 'Workout', 'Focus', 'Commute'].map(m => (
                <button key={m} className="px-4 py-2 rounded-full bg-[#ffffff12] text-sm font-medium whitespace-nowrap">{m}</button>
              ))}
            </div>
          </div>

          {/* Quick picks */}
          <div className="px-4 mt-4">
            <h2 className="text-xl font-bold mb-3">Quick picks</h2>
            <div className="grid grid-cols-2 gap-2">
              {allSongs.slice(0, 8).map(song => (
                <button key={song.id} onClick={() => playSong(song)} className="flex items-center gap-3 bg-[#ffffff08] rounded-md p-2 text-left">
                  <div className="w-12 h-12 rounded bg-[#272727] overflow-hidden flex-shrink-0">
                    {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#aaa] m-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{song.title}</p>
                    <p className="text-[11px] text-[#aaa] truncate">{song.artist_name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Charts shortcut */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Charts</h2>
              <button onClick={() => setSection('charts')} className="text-[#3ea6ff] text-sm font-medium">See all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                { label: 'Trending', icon: TrendingUp, color: '#ff0000' },
                { label: 'Top Songs', icon: Music, color: '#3ea6ff' },
                { label: 'Top Artists', icon: User, color: '#ff8c00' },
                { label: 'Music Videos', icon: BarChart3, color: '#00c853' },
              ].map(c => (
                <button key={c.label} onClick={() => { setChartType(c.label.toLowerCase().replace(/\s/g, '_') as any); setSection('charts'); }} className="min-w-[120px] text-left">
                  <div className="w-[120px] h-[120px] rounded-lg flex items-center justify-center mb-2" style={{ background: `linear-gradient(135deg, ${c.color}40, ${c.color}10)` }}>
                    <c.icon className="w-10 h-10" style={{ color: c.color }} />
                  </div>
                  <p className="text-xs font-medium">{c.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mixed for you */}
          <div className="px-4 mt-6">
            <h2 className="text-xl font-bold mb-3">Mixed for you</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allArtists.slice(0, 5).map(a => (
                <button key={a.id} onClick={() => openArtist(a)} className="min-w-[140px] text-left">
                  <div className="w-[140px] h-[140px] rounded-lg bg-[#272727] overflow-hidden mb-2">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-10 h-10 text-[#555] m-auto mt-12" />}
                  </div>
                  <p className="text-xs font-bold truncate">{a.artist_name} Mix</p>
                  <p className="text-[11px] text-[#aaa] truncate">{a.artist_name}, and more</p>
                </button>
              ))}
            </div>
          </div>

          {/* Listen again */}
          <div className="px-4 mt-6 mb-4">
            <h2 className="text-xl font-bold mb-3">Listen again</h2>
            {allSongs.slice(0, 5).map(song => (
              <button key={song.id} onClick={() => playSong(song)} className="flex items-center gap-3 py-2.5 w-full text-left">
                <div className="w-12 h-12 rounded bg-[#272727] overflow-hidden flex-shrink-0">
                  {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#aaa] m-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-[#aaa]">{song.artist_name} • {formatNumber(song.streams)} plays</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#aaa]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH */}
      {section === 'search' && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 bg-[#272727] rounded-lg px-3 py-2.5">
              <Search className="w-4 h-4 text-[#aaa]" />
              <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search songs, artists..." className="bg-transparent text-sm text-white placeholder-[#aaa] outline-none flex-1" autoFocus />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}><X className="w-4 h-4 text-[#aaa]" /></button>}
            </div>
          </div>
          {searchResults.length > 0 ? (
            <div className="px-4 mt-2">
              {searchResults.map(a => (
                <button key={a.id} onClick={() => openArtist(a)} className="flex items-center gap-3 py-2.5 w-full text-left">
                  <div className="w-12 h-12 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#aaa] m-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.artist_name}</p>
                    <p className="text-xs text-[#aaa]">{formatNumber(a.youtube_subscribers)} subscribers</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="px-4 mt-8 text-center text-[#aaa] text-sm">No results</div>
          ) : (
            <div className="px-4 mt-4">
              <h3 className="font-bold mb-3">Trending Searches</h3>
              {allArtists.slice(0, 5).map((a, i) => (
                <button key={a.id} onClick={() => openArtist(a)} className="flex items-center gap-3 py-2.5 w-full text-left">
                  <span className="text-sm text-[#aaa] w-5 text-right">{i + 1}</span>
                  <TrendingUp className="w-4 h-4 text-[#ff0000]" />
                  <span className="text-sm">{a.artist_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIBRARY */}
      {section === 'library' && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-2xl font-bold mb-4">Library</h1>
            <div className="flex gap-2 mb-4">
              {['Recent', 'Downloads', 'Playlists', 'Artists'].map(f => (
                <button key={f} className="px-3 py-1.5 rounded-full bg-[#ffffff12] text-xs font-medium">{f}</button>
              ))}
            </div>
          </div>
          <div className="px-4">
            <button onClick={() => openArtist(profile)} className="flex items-center gap-3 py-3 w-full text-left">
              <div className="w-14 h-14 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-[#aaa] m-4" />}
              </div>
              <div>
                <p className="text-sm font-bold">{profile.artist_name}</p>
                <p className="text-xs text-[#aaa]">Your channel</p>
              </div>
            </button>
            {allArtists.slice(0, 6).map(a => (
              <button key={a.id} onClick={() => openArtist(a)} className="flex items-center gap-3 py-2.5 w-full text-left">
                <div className="w-12 h-12 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                  {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#aaa] m-3.5" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{a.artist_name}</p>
                  <p className="text-xs text-[#aaa]">{formatNumber(a.youtube_subscribers)} subscribers</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CHARTS */}
      {section === 'charts' && (
        <div>
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => setSection('home')}><ChevronLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-bold">Charts</h1>
          </div>
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            {[
              { key: 'trending', label: 'Trending' },
              { key: 'top_songs', label: 'Top Songs' },
              { key: 'top_artists', label: 'Top Artists' },
              { key: 'top_music_videos', label: 'Music Videos' },
            ].map(c => (
              <button key={c.key} onClick={() => setChartType(c.key as any)} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${chartType === c.key ? 'bg-white text-black' : 'bg-[#ffffff12]'}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="px-4">
            {chartType === 'top_artists' ? (
              chartArtists.map((a, i) => (
                <button key={a.id} onClick={() => openArtist(a)} className="flex items-center gap-3 py-2.5 w-full text-left">
                  <span className="w-6 text-sm font-bold text-[#aaa] text-right">{i + 1}</span>
                  <div className="w-12 h-12 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#aaa] m-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.artist_name}</p>
                    <p className="text-xs text-[#aaa]">{formatNumber(a.youtube_subscribers)} subscribers</p>
                  </div>
                  {i < 3 && <TrendingUp className="w-4 h-4 text-[#ff0000]" />}
                </button>
              ))
            ) : (
              chartSongs.map((s, i) => (
                <button key={s.id} onClick={() => playSong(s)} className="flex items-center gap-3 py-2.5 w-full text-left">
                  <span className="w-6 text-sm font-bold text-[#aaa] text-right">{i + 1}</span>
                  <div className="w-12 h-12 rounded bg-[#272727] overflow-hidden flex-shrink-0">
                    {s.cover_url ? <img src={s.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#aaa] m-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-[#aaa]">{s.artist_name} • {formatNumber(s.streams)} plays</p>
                  </div>
                  {i < 3 && <TrendingUp className="w-4 h-4 text-[#ff0000]" />}
                </button>
              ))
            )}
            {chartSongs.length === 0 && chartArtists.length === 0 && <p className="text-[#aaa] text-sm text-center py-8">No chart data yet</p>}
          </div>
        </div>
      )}

      {/* ARTIST */}
      {section === 'artist' && (
        <div>
          <div className="relative h-56 overflow-hidden">
            {viewingArtist.avatar_url ? (
              <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-[#272727] to-[#030303]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" />
            <button onClick={() => setSection('home')} className="absolute top-4 left-4"><ChevronLeft className="w-6 h-6" /></button>
            <div className="absolute bottom-4 left-4">
              <h1 className="text-2xl font-black">{viewingArtist.artist_name}</h1>
              <p className="text-xs text-[#aaa] mt-0.5">{formatNumber(viewingArtist.youtube_subscribers)} subscribers</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => { if (artistSongs.length > 0) playSong({ ...artistSongs[0], artist_name: viewingArtist.artist_name }); }} className="flex items-center gap-2 bg-white text-black rounded-full px-5 py-2 text-sm font-bold">
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
            <button className="flex items-center gap-2 border border-[#aaa] rounded-full px-5 py-2 text-sm font-medium">
              <Radio className="w-4 h-4" /> Radio
            </button>
          </div>
          <div className="px-4">
            <h3 className="font-bold mb-2">Songs</h3>
            {artistSongs.length > 0 ? artistSongs.map((s, i) => (
              <button key={s.id} onClick={() => playSong({ ...s, artist_name: viewingArtist.artist_name })} className="flex items-center gap-3 py-2 w-full text-left">
                <div className="w-12 h-12 rounded bg-[#272727] overflow-hidden flex-shrink-0">
                  {s.cover_url ? <img src={s.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#aaa] m-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${currentlyPlaying?.id === s.id ? 'text-[#3ea6ff]' : ''}`}>{s.title}</p>
                  <p className="text-xs text-[#aaa]">{formatNumber(s.streams)} plays</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#aaa]" />
              </button>
            )) : <p className="text-[#aaa] text-sm">No songs yet</p>}
          </div>
          <div className="px-4 mt-6 mb-4">
            <h3 className="font-bold mb-3">Similar artists</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allArtists.filter(a => a.id !== viewingArtist.id).slice(0, 6).map(a => (
                <button key={a.id} onClick={() => openArtist(a)} className="flex flex-col items-center gap-2 min-w-[80px]">
                  <div className="w-16 h-16 rounded-full bg-[#272727] overflow-hidden">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#aaa] m-5" />}
                  </div>
                  <p className="text-[11px] text-center truncate w-full">{a.artist_name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NOW PLAYING BAR */}
      {currentlyPlaying && (
        <div className="fixed bottom-[56px] left-0 right-0 bg-[#1a1a1a] border-t border-[#272727] p-2 z-40">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded bg-[#272727] overflow-hidden flex-shrink-0">
              {currentlyPlaying.cover_url ? <img src={currentlyPlaying.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#aaa] m-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{currentlyPlaying.title}</p>
              <p className="text-[10px] text-[#aaa]">{currentlyPlaying.artist_name}</p>
            </div>
            <Heart className="w-4 h-4 text-[#aaa]" />
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-1 h-[2px] bg-[#444] rounded-full"><div className="h-full w-1/3 bg-[#ff0000] rounded-full" /></div>
        </div>
      )}

      </div>{/* end scrollable */}

      {/* BOTTOM NAV */}
      <div className="flex-shrink-0 bg-[#030303] border-t border-[#272727] flex justify-around py-2 z-30">
        <button onClick={() => setSection('home')} className={`flex flex-col items-center gap-0.5 ${section === 'home' ? 'text-white' : 'text-[#aaa]'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => setSection('charts')} className={`flex flex-col items-center gap-0.5 ${section === 'charts' ? 'text-white' : 'text-[#aaa]'}`}>
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Charts</span>
        </button>
        <button onClick={() => setSection('search')} className={`flex flex-col items-center gap-0.5 ${section === 'search' ? 'text-white' : 'text-[#aaa]'}`}>
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Explore</span>
        </button>
        <button onClick={() => setSection('library')} className={`flex flex-col items-center gap-0.5 ${section === 'library' ? 'text-white' : 'text-[#aaa]'}`}>
          <Library className="w-5 h-5" />
          <span className="text-[10px]">Library</span>
        </button>
      </div>
    </div>
  );
}
