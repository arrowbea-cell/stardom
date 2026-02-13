import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Search, Home, Library, ChevronRight, ChevronLeft, Play, Clock, Music, Shuffle, SkipBack, SkipForward, Pause, Heart, Plus, X, Edit3, Check, User, MoreHorizontal, Bell, Settings, Share2, ListMusic } from 'lucide-react';
import spotifyLogo from '@/assets/spotify-logo.png';

interface Props {
  profile: Profile;
}

interface Song {
  id: string;
  title: string;
  cover_url: string | null;
  streams: number;
  artist_id: string;
}

type SpotifySection = 'home' | 'search' | 'library' | 'artist' | 'playlist' | 'now-playing';

interface Playlist {
  id: string;
  name: string;
  description: string;
  color: string;
  songs: (Song & { artist_name: string })[];
}

export default function SpotifyApp({ profile }: Props) {
  const { user } = useAuth();
  const [section, setSection] = useState<SpotifySection>('home');
  const [prevSection, setPrevSection] = useState<SpotifySection>('home');
  const [songs, setSongs] = useState<Song[]>([]);
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [allSongs, setAllSongs] = useState<(Song & { artist_name: string })[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<(Song & { artist_name?: string }) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [editingBio, setEditingBio] = useState(false);
  const [editingPick, setEditingPick] = useState(false);
  const [bioText, setBioText] = useState(profile.bio || '');
  const [pickText, setPickText] = useState('');
  const [liked, setLiked] = useState(false);
  const [progress, setProgress] = useState(33);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data } = await supabase.from('profiles').select('*').order('monthly_listeners', { ascending: false }).limit(20);
      if (data) setAllArtists(data as Profile[]);
    };
    fetchArtists();
  }, []);

  useEffect(() => {
    const fetchAllSongs = async () => {
      const { data: songsData } = await supabase.from('songs').select('*').order('streams', { ascending: false }).limit(50);
      if (songsData && allArtists.length > 0) {
        const mapped = songsData.map((s: any) => {
          const artist = allArtists.find(a => a.id === s.artist_id);
          return { ...s, artist_name: artist?.artist_name || 'Unknown' };
        });
        setAllSongs(mapped);
      }
    };
    if (allArtists.length > 0) fetchAllSongs();
  }, [allArtists]);

  useEffect(() => {
    const fetchSongs = async () => {
      const { data } = await supabase.from('songs').select('*').eq('artist_id', viewingArtist.id).order('streams', { ascending: false });
      if (data) setSongs(data as Song[]);
    };
    fetchSongs();
  }, [viewingArtist.id]);

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setProgress(p => p >= 100 ? 0 : p + 0.5);
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const navigate = (to: SpotifySection) => { setPrevSection(section); setSection(to); };
  const openArtist = (artist: Profile) => { setViewingArtist(artist); navigate('artist'); };
  
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('artist_name', `%${q}%`).limit(10);
    if (data) setSearchResults(data as Profile[]);
  };

  const saveBio = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ bio: bioText }).eq('user_id', user.id);
    setEditingBio(false);
  };

  const saveArtistPick = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ artist_pick: pickText }).eq('user_id', user.id);
    setEditingPick(false);
  };

  const isOwnProfile = viewingArtist.user_id === user?.id;
  const playlistColors = ['#1e3264', '#e8115b', '#148a08', '#e91429', '#8400e7', '#1e3264', '#f59b23', '#dc148c'];

  const getPlaylistImage = (idx: number) => {
    const artist = allArtists[idx % allArtists.length];
    return artist?.avatar_url || null;
  };

  const generatedPlaylists: Playlist[] = [
    { id: 'daily-mix-1', name: 'Daily Mix 1', description: `${profile.artist_name} and more`, color: playlistColors[0], songs: allSongs.slice(0, 6) },
    { id: 'top-hits', name: "Today's Top Hits", description: 'The hottest tracks right now', color: playlistColors[1], songs: allSongs.slice(0, 10) },
    { id: 'discover-weekly', name: 'Discover Weekly', description: 'Your weekly mixtape of fresh music', color: playlistColors[4], songs: allSongs.slice(2, 8) },
    { id: 'release-radar', name: 'Release Radar', description: 'Catch all the latest from artists you follow', color: playlistColors[2], songs: allSongs.slice(1, 7) },
    { id: 'on-repeat', name: 'On Repeat', description: "Songs you can't stop playing", color: playlistColors[3], songs: allSongs.slice(0, 5) },
    { id: 'chill-vibes', name: 'Chill Vibes', description: 'Kick back with these mellow tracks', color: playlistColors[5], songs: allSongs.slice(3, 9) },
  ];

  const openPlaylist = (pl: Playlist) => { setViewingPlaylist(pl); navigate('playlist'); };

  const playSong = (song: Song & { artist_name?: string }) => {
    setCurrentlyPlaying(song);
    setIsPlaying(true);
    setProgress(0);
  };

  const goBack = () => setSection(prevSection);

  // ── FULL-SCREEN NOW PLAYING ──
  if (section === 'now-playing' && currentlyPlaying) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#535353] to-[#121212] text-white flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={goBack}><ChevronLeft className="w-6 h-6" /></button>
          <div className="text-center">
            <p className="text-[10px] text-[#b3b3b3] uppercase tracking-widest">Playing from</p>
            <p className="text-xs font-bold">{currentlyPlaying.artist_name || 'Your Music'}</p>
          </div>
          <MoreHorizontal className="w-6 h-6 text-[#b3b3b3]" />
        </div>

        {/* Album art */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-[340px] aspect-square rounded-lg bg-[#282828] overflow-hidden shadow-2xl">
            {currentlyPlaying.cover_url ? (
              <img src={currentlyPlaying.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#111]">
                <Music className="w-24 h-24 text-[#b3b3b3]" />
              </div>
            )}
          </div>
        </div>

        {/* Song info */}
        <div className="px-8 mt-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{currentlyPlaying.title}</p>
              <p className="text-sm text-[#b3b3b3]">{currentlyPlaying.artist_name}</p>
            </div>
            <button onClick={() => setLiked(!liked)}>
              <Heart className={`w-6 h-6 ${liked ? 'text-[#1db954] fill-[#1db954]' : 'text-[#b3b3b3]'}`} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-8 mt-6">
          <div className="h-1 bg-[#4d4d4d] rounded-full relative">
            <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#b3b3b3]">1:04</span>
            <span className="text-[10px] text-[#b3b3b3]">3:24</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-8 mt-4 mb-4">
          <Shuffle className="w-5 h-5 text-[#b3b3b3]" />
          <SkipBack className="w-8 h-8 text-white fill-white" />
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
            {isPlaying ? <Pause className="w-8 h-8 text-black" /> : <Play className="w-8 h-8 text-black ml-1" />}
          </button>
          <SkipForward className="w-8 h-8 text-white fill-white" />
          <ListMusic className="w-5 h-5 text-[#b3b3b3]" />
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between px-8 pb-6">
          <Share2 className="w-4 h-4 text-[#b3b3b3]" />
          <ListMusic className="w-4 h-4 text-[#b3b3b3]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white" style={{ paddingBottom: currentlyPlaying ? '140px' : '80px' }}>
      
      {/* ── HOME ── */}
      {section === 'home' && (
        <div>
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#121212] px-4 pt-4 pb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#282828] overflow-hidden">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#b3b3b3] m-2" />}
                </div>
                <h1 className="text-xl font-bold">Good evening</h1>
              </div>
              <div className="flex items-center gap-5">
                <Bell className="w-5 h-5 text-white" />
                <Clock className="w-5 h-5 text-white" />
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Quick-access grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Liked Songs', icon: '💚', action: () => openPlaylist({ id: 'liked', name: 'Liked Songs', description: 'Songs you liked', color: '#1e3264', songs: allSongs.slice(0, 5) }) },
                { name: profile.artist_name, img: profile.avatar_url, action: () => openArtist(profile) },
                { name: 'Daily Mix 1', icon: '🎵', action: () => openPlaylist(generatedPlaylists[0]) },
                { name: 'Discover Weekly', icon: '🔮', action: () => openPlaylist(generatedPlaylists[2]) },
                { name: 'Release Radar', icon: '📡', action: () => openPlaylist(generatedPlaylists[3]) },
                { name: 'On Repeat', icon: '🔁', action: () => openPlaylist(generatedPlaylists[4]) },
              ].map((item, i) => (
                <button key={i} onClick={item.action} className="flex items-center gap-3 bg-[#ffffff12] rounded-[4px] overflow-hidden hover:bg-[#ffffff20] transition-colors h-14">
                  <div className="w-14 h-14 bg-[#282828] flex items-center justify-center flex-shrink-0">
                    {'img' in item && item.img ? <img src={item.img} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">{item.icon}</span>}
                  </div>
                  <span className="text-[13px] font-bold truncate pr-2">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Made For You */}
          <div className="px-4 mt-4">
            <h2 className="text-[22px] font-bold mb-3">Made For You</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {generatedPlaylists.slice(0, 4).map((pl, idx) => (
                <button key={pl.id} onClick={() => openPlaylist(pl)} className="min-w-[140px] max-w-[140px] text-left group">
                  <div className="w-[140px] h-[140px] rounded-md mb-2 shadow-lg relative overflow-hidden" style={{ backgroundColor: pl.color }}>
                    {getPlaylistImage(idx) ? <img src={getPlaylistImage(idx)!} alt="" className="w-full h-full object-cover opacity-80" /> : <Music className="w-12 h-12 text-white/40 absolute inset-0 m-auto" />}
                    <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </div>
                  </div>
                  <p className="text-[13px] font-bold truncate">{pl.name}</p>
                  <p className="text-[11px] text-[#b3b3b3] truncate leading-tight mt-0.5">{pl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recently Played */}
          <div className="px-4 mt-6">
            <h2 className="text-[22px] font-bold mb-3">Recently Played</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {allArtists.slice(0, 6).map((artist) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="min-w-[120px] max-w-[120px] text-left">
                  <div className="w-[120px] h-[120px] rounded-full bg-[#282828] overflow-hidden mb-2 shadow-lg">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-10 h-10 text-[#b3b3b3] m-auto mt-10" />}
                  </div>
                  <p className="text-[13px] font-bold truncate text-center">{artist.artist_name}</p>
                  <p className="text-[11px] text-[#b3b3b3] text-center">Artist</p>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Playlists */}
          <div className="px-4 mt-6">
            <h2 className="text-[22px] font-bold mb-3">Popular Playlists</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {generatedPlaylists.slice(1, 5).map((pl, idx) => (
                <button key={pl.id} onClick={() => openPlaylist(pl)} className="min-w-[140px] max-w-[140px] text-left">
                  <div className="w-[140px] h-[140px] rounded-md mb-2 shadow-lg overflow-hidden" style={{ backgroundColor: pl.color }}>
                    {getPlaylistImage(idx + 1) ? <img src={getPlaylistImage(idx + 1)!} alt="" className="w-full h-full object-cover opacity-70" /> : <Music className="w-12 h-12 text-white/30 m-auto mt-12" />}
                  </div>
                  <p className="text-[13px] font-bold truncate">{pl.name}</p>
                  <p className="text-[11px] text-[#b3b3b3] truncate">{pl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Your Top Mixes */}
          <div className="px-4 mt-6 mb-4">
            <h2 className="text-[22px] font-bold mb-3">Your Top Mixes</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {allArtists.slice(0, 4).map((artist) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="min-w-[140px] max-w-[140px] text-left">
                  <div className="w-[140px] h-[140px] rounded-md mb-2 overflow-hidden shadow-lg bg-gradient-to-br from-[#282828] to-[#181818]">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover opacity-80" /> : <Music className="w-12 h-12 text-[#b3b3b3] m-auto mt-12" />}
                  </div>
                  <p className="text-[13px] font-bold truncate">{artist.artist_name} Mix</p>
                  <p className="text-[11px] text-[#b3b3b3] truncate">{artist.artist_name} and more</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH ── */}
      {section === 'search' && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-[22px] font-bold mb-3">Search</h1>
            <div className="flex items-center gap-2 bg-white rounded-[4px] px-3 py-2.5">
              <Search className="w-5 h-5 text-[#121212]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="What do you want to listen to?"
                className="bg-transparent text-sm text-[#121212] placeholder-[#757575] outline-none flex-1 font-medium"
                autoFocus
              />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}><X className="w-5 h-5 text-[#121212]" /></button>}
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div className="px-4 mt-3">
              {searchResults.map((artist) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="flex items-center gap-3 py-2.5 w-full text-left hover:bg-[#ffffff08] rounded px-1">
                  <div className="w-12 h-12 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#b3b3b3] m-3.5" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">{artist.artist_name}</p>
                    <p className="text-[12px] text-[#b3b3b3]">Artist</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length === 0 ? (
            <div className="px-4 mt-4">
              <h3 className="text-base font-bold mb-3">Browse all</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Latin', 'EDM', 'Indie', 'K-Pop'].map((genre, i) => (
                  <div key={genre} className="h-24 rounded-lg flex items-end p-3 font-bold text-sm overflow-hidden relative" style={{ backgroundColor: playlistColors[i % playlistColors.length] }}>
                    {genre}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 mt-8 text-center text-[#b3b3b3] text-sm">No results found for "{searchQuery}"</div>
          )}
        </div>
      )}

      {/* ── LIBRARY ── */}
      {section === 'library' && (
        <div>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#282828] overflow-hidden">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-[#b3b3b3] m-1.5" />}
              </div>
              <h1 className="text-[22px] font-bold">Your Library</h1>
            </div>
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-[#b3b3b3]" />
              <Plus className="w-5 h-5 text-[#b3b3b3]" />
            </div>
          </div>

          {/* Filter chips */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto">
            {['Playlists', 'Artists', 'Albums'].map(f => (
              <button key={f} className="px-3 py-1.5 rounded-full bg-[#ffffff12] text-[12px] font-medium whitespace-nowrap">{f}</button>
            ))}
          </div>

          {/* Your profile */}
          <div className="px-4 mt-2">
            <button onClick={() => openArtist(profile)} className="flex items-center gap-3 py-2.5 w-full text-left">
              <div className="w-14 h-14 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-[#b3b3b3] m-4" />}
              </div>
              <div>
                <p className="text-[14px] font-bold">{profile.artist_name}</p>
                <p className="text-[12px] text-[#b3b3b3]">Artist</p>
              </div>
            </button>
          </div>

          {/* Playlists */}
          <div className="px-4 mt-1">
            {generatedPlaylists.map((pl, idx) => (
              <button key={pl.id} onClick={() => openPlaylist(pl)} className="flex items-center gap-3 py-2.5 w-full text-left">
                <div className="w-14 h-14 rounded-[4px] overflow-hidden flex-shrink-0" style={{ backgroundColor: pl.color }}>
                  {getPlaylistImage(idx) ? <img src={getPlaylistImage(idx)!} alt="" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 text-white/50 m-4" />}
                </div>
                <div>
                  <p className="text-[14px] font-medium">{pl.name}</p>
                  <p className="text-[12px] text-[#b3b3b3]">Playlist • {pl.songs.length} songs</p>
                </div>
              </button>
            ))}
          </div>

          {/* Followed Artists */}
          <div className="px-4 mt-2">
            {allArtists.slice(0, 6).map((artist) => (
              <button key={artist.id} onClick={() => openArtist(artist)} className="flex items-center gap-3 py-2.5 w-full text-left">
                <div className="w-14 h-14 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                  {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#b3b3b3] m-4" />}
                </div>
                <div>
                  <p className="text-[14px] font-medium">{artist.artist_name}</p>
                  <p className="text-[12px] text-[#b3b3b3]">Artist</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PLAYLIST VIEW ── */}
      {section === 'playlist' && viewingPlaylist && (
        <div>
          <div className="relative pt-4 pb-4 px-4" style={{ background: `linear-gradient(180deg, ${viewingPlaylist.color} 0%, #121212 100%)` }}>
            <button onClick={goBack} className="mb-4"><ChevronLeft className="w-6 h-6" /></button>
            <div className="w-52 h-52 mx-auto rounded-md shadow-2xl mb-4 overflow-hidden" style={{ backgroundColor: viewingPlaylist.color }}>
              {viewingPlaylist.songs[0]?.cover_url ? <img src={viewingPlaylist.songs[0].cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-16 h-16 text-white/40 m-auto mt-16" />}
            </div>
            <h1 className="text-2xl font-bold">{viewingPlaylist.name}</h1>
            <p className="text-[13px] text-[#b3b3b3] mt-1">{viewingPlaylist.description}</p>
            <div className="flex items-center gap-1 mt-2">
              <img src={spotifyLogo} alt="" className="w-4 h-4" />
              <p className="text-[11px] text-[#b3b3b3]">Spotify • {viewingPlaylist.songs.length} songs</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Heart className="w-5 h-5 text-[#b3b3b3]" />
              <MoreHorizontal className="w-5 h-5 text-[#b3b3b3]" />
            </div>
            <div className="flex items-center gap-4">
              <Shuffle className="w-5 h-5 text-[#1db954]" />
              <button onClick={() => { if (viewingPlaylist.songs.length > 0) playSong(viewingPlaylist.songs[0]); }} className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-black ml-0.5" />
              </button>
            </div>
          </div>
          <div className="px-4">
            {viewingPlaylist.songs.map((song, i) => (
              <button key={song.id + i} onClick={() => playSong(song)} className="flex items-center gap-3 py-2.5 w-full text-left">
                <div className="w-10 h-10 bg-[#282828] rounded-[4px] overflow-hidden flex-shrink-0">
                  {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#b3b3b3] m-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-medium truncate ${currentlyPlaying?.id === song.id ? 'text-[#1db954]' : ''}`}>{song.title}</p>
                  <p className="text-[12px] text-[#b3b3b3]">{song.artist_name}</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#b3b3b3]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ARTIST VIEW ── */}
      {section === 'artist' && (
        <div>
          {/* Hero image */}
          <div className="relative h-72 overflow-hidden">
            {viewingArtist.avatar_url ? (
              <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-[#535353] to-[#121212]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
            <button onClick={goBack} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-4">
              <h1 className="text-3xl font-black">{viewingArtist.artist_name}</h1>
              <p className="text-[13px] text-[#b3b3b3] mt-0.5">{formatNumber(viewingArtist.monthly_listeners)} monthly listeners</p>
            </div>
          </div>

          {/* Actions row */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="border border-[#b3b3b3] rounded-full px-4 py-1.5 text-[12px] font-bold">Follow</button>
              <MoreHorizontal className="w-6 h-6 text-[#b3b3b3]" />
            </div>
            <div className="flex items-center gap-4">
              <Shuffle className="w-5 h-5 text-[#1db954]" />
              <button onClick={() => { if (songs.length > 0) playSong({ ...songs[0], artist_name: viewingArtist.artist_name }); }} className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-black ml-0.5" />
              </button>
            </div>
          </div>

          {/* Popular */}
          <div className="px-4">
            <h3 className="text-base font-bold mb-2">Popular</h3>
            {songs.length > 0 ? songs.slice(0, 5).map((song, i) => (
              <button key={song.id} onClick={() => playSong({ ...song, artist_name: viewingArtist.artist_name })} className="flex items-center gap-3 py-2 w-full text-left">
                <span className="w-5 text-[14px] text-[#b3b3b3] text-center">{i + 1}</span>
                <div className="w-10 h-10 bg-[#282828] rounded-[4px] overflow-hidden flex-shrink-0">
                  {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#b3b3b3] m-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-medium truncate ${currentlyPlaying?.id === song.id ? 'text-[#1db954]' : ''}`}>{song.title}</p>
                  <p className="text-[12px] text-[#b3b3b3]">{formatNumber(song.streams)} plays</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[#b3b3b3]" />
              </button>
            )) : <p className="text-[13px] text-[#b3b3b3]">No songs released yet</p>}
            {songs.length > 5 && <button className="text-[13px] text-[#b3b3b3] font-bold mt-2">See discography</button>}
          </div>

          {/* Artist Pick */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold">Artist Pick</h3>
              {isOwnProfile && !editingPick && <button onClick={() => setEditingPick(true)}><Edit3 className="w-4 h-4 text-[#b3b3b3]" /></button>}
            </div>
            {editingPick ? (
              <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2">
                <textarea value={pickText} onChange={(e) => setPickText(e.target.value)} placeholder="Set your artist pick..." className="w-full bg-[#282828] rounded p-3 text-sm text-white outline-none resize-none h-16" />
                <div className="flex gap-2">
                  <button onClick={saveArtistPick} className="bg-[#1db954] text-black text-xs font-bold px-4 py-2 rounded-full">Save</button>
                  <button onClick={() => setEditingPick(false)} className="text-xs text-[#b3b3b3] px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-[13px] text-[#b3b3b3]">{(viewingArtist as any).artist_pick || 'No artist pick set yet.'}</p>
              </div>
            )}
          </div>

          {/* About */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold">About</h3>
              {isOwnProfile && !editingBio && <button onClick={() => { setBioText(viewingArtist.bio || ''); setEditingBio(true); }}><Edit3 className="w-4 h-4 text-[#b3b3b3]" /></button>}
            </div>
            {editingBio ? (
              <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2">
                <textarea value={bioText} onChange={(e) => setBioText(e.target.value)} className="w-full bg-[#282828] rounded p-3 text-sm text-white outline-none resize-none h-16" />
                <div className="flex gap-2">
                  <button onClick={saveBio} className="bg-[#1db954] text-black text-xs font-bold px-4 py-2 rounded-full">Save</button>
                  <button onClick={() => setEditingBio(false)} className="text-xs text-[#b3b3b3] px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden">
                {viewingArtist.avatar_url && (
                  <div className="h-48 overflow-hidden rounded-lg">
                    <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                )}
                <div className={`${viewingArtist.avatar_url ? 'absolute bottom-0 left-0 right-0' : ''} p-4`}>
                  <p className="text-[13px] text-white/90 line-clamp-3">{viewingArtist.bio || 'No bio yet.'}</p>
                  <div className="flex gap-3 mt-2 text-[12px] text-[#b3b3b3]">
                    <span>{formatNumber(viewingArtist.spotify_followers)} followers</span>
                    <span>{formatNumber(viewingArtist.monthly_listeners)} monthly listeners</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fans also like */}
          <div className="px-4 mt-6 mb-4">
            <h3 className="text-base font-bold mb-3">Fans also like</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {allArtists.filter(a => a.id !== viewingArtist.id).slice(0, 6).map((a) => (
                <button key={a.id} onClick={() => openArtist(a)} className="flex flex-col items-center gap-2 min-w-[100px]">
                  <div className="w-24 h-24 rounded-full bg-[#282828] overflow-hidden">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-6 h-6 text-[#b3b3b3] m-auto mt-8" />}
                  </div>
                  <p className="text-[12px] text-center truncate w-full font-medium">{a.artist_name}</p>
                  <p className="text-[11px] text-[#b3b3b3] -mt-1">Artist</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NOW PLAYING BAR ── */}
      {currentlyPlaying && section !== 'now-playing' && (
        <div className="fixed bottom-[52px] left-0 right-0 z-40">
          <button onClick={() => navigate('now-playing')} className="w-full bg-[#382818] mx-2 rounded-md p-2 flex items-center gap-2" style={{ width: 'calc(100% - 16px)' }}>
            <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden flex-shrink-0">
              {currentlyPlaying.cover_url ? <img src={currentlyPlaying.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#b3b3b3] m-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate">{currentlyPlaying.title}</p>
              <p className="text-[11px] text-[#b3b3b3]">{currentlyPlaying.artist_name || viewingArtist.artist_name}</p>
            </div>
            <div className="flex items-center gap-3 pr-1">
              <Heart className="w-4 h-4 text-[#b3b3b3]" />
              <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </button>
          <div className="mx-2 h-[2px] bg-[#4d4d4d] rounded-full">
            <div className="h-full bg-[#1db954] rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      {section !== 'now-playing' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#121212] via-[#121212] to-[#12121200] pt-2 pb-2 z-50">
          <div className="flex justify-around py-1 px-4">
            <button onClick={() => setSection('home')} className={`flex flex-col items-center gap-0.5 ${section === 'home' ? 'text-white' : 'text-[#b3b3b3]'}`}>
              <Home className={`w-6 h-6 ${section === 'home' ? 'fill-white' : ''}`} />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button onClick={() => setSection('search')} className={`flex flex-col items-center gap-0.5 ${section === 'search' ? 'text-white' : 'text-[#b3b3b3]'}`}>
              <Search className={`w-6 h-6 ${section === 'search' ? 'fill-white' : ''}`} />
              <span className="text-[10px] font-medium">Search</span>
            </button>
            <button onClick={() => setSection('library')} className={`flex flex-col items-center gap-0.5 ${section === 'library' ? 'text-white' : 'text-[#b3b3b3]'}`}>
              <Library className={`w-6 h-6 ${section === 'library' ? 'fill-white' : ''}`} />
              <span className="text-[10px] font-medium">Your Library</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
