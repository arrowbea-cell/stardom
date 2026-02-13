import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Search, Home, Library, ChevronRight, Play, Clock, Music, Shuffle, SkipBack, SkipForward, Pause, Heart, Plus } from 'lucide-react';

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

type SpotifySection = 'home' | 'artist' | 'playlist';

interface Playlist {
  id: string;
  name: string;
  description: string;
  color: string;
  songs: (Song & { artist_name: string })[];
}

export default function SpotifyApp({ profile }: Props) {
  const [section, setSection] = useState<SpotifySection>('home');
  const [songs, setSongs] = useState<Song[]>([]);
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [allSongs, setAllSongs] = useState<(Song & { artist_name: string })[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<(Song & { artist_name?: string }) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('monthly_listeners', { ascending: false })
        .limit(20);
      if (data) setAllArtists(data as Profile[]);
    };
    fetchArtists();
  }, []);

  useEffect(() => {
    const fetchAllSongs = async () => {
      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .order('streams', { ascending: false })
        .limit(50);
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
      const { data } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', viewingArtist.id)
        .order('streams', { ascending: false });
      if (data) setSongs(data as Song[]);
    };
    fetchSongs();
  }, [viewingArtist.id]);

  const openArtist = (artist: Profile) => {
    setViewingArtist(artist);
    setSection('artist');
  };

  const playlistColors = ['#1e3264', '#e8115b', '#148a08', '#e91429', '#8400e7', '#1e3264', '#f59b23', '#dc148c'];

  const generatedPlaylists: Playlist[] = [
    {
      id: 'daily-mix-1',
      name: 'Daily Mix 1',
      description: `${profile.artist_name} and more`,
      color: playlistColors[0],
      songs: allSongs.slice(0, 6),
    },
    {
      id: 'top-hits',
      name: 'Today\'s Top Hits',
      description: 'The hottest tracks right now',
      color: playlistColors[1],
      songs: allSongs.slice(0, 10),
    },
    {
      id: 'discover-weekly',
      name: 'Discover Weekly',
      description: 'Your weekly mixtape of fresh music',
      color: playlistColors[4],
      songs: allSongs.slice(2, 8),
    },
    {
      id: 'release-radar',
      name: 'Release Radar',
      description: 'Catch all the latest from artists you follow',
      color: playlistColors[2],
      songs: allSongs.slice(1, 7),
    },
    {
      id: 'on-repeat',
      name: 'On Repeat',
      description: 'Songs you can\'t stop playing',
      color: playlistColors[3],
      songs: allSongs.slice(0, 5),
    },
    {
      id: 'chill-vibes',
      name: 'Chill Vibes',
      description: 'Kick back with these mellow tracks',
      color: playlistColors[5],
      songs: allSongs.slice(3, 9),
    },
  ];

  const openPlaylist = (pl: Playlist) => {
    setViewingPlaylist(pl);
    setSection('playlist');
  };

  const playSong = (song: Song & { artist_name?: string }) => {
    setCurrentlyPlaying(song);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#fff] pb-36">
      {section === 'home' && (
        <div>
          {/* Greeting header */}
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#121212] px-4 pt-4 pb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Good evening</h1>
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-white" />
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Quick access grid - like Spotify's top row */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Liked Songs', icon: '💚' },
                { name: profile.artist_name, img: profile.avatar_url },
                { name: 'Daily Mix 1', icon: '🎵' },
                { name: 'Discover Weekly', icon: '🔮' },
                { name: 'Release Radar', icon: '📡' },
                { name: 'On Repeat', icon: '🔁' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i === 1) openArtist(profile);
                    else if (i === 2) openPlaylist(generatedPlaylists[0]);
                    else if (i === 3) openPlaylist(generatedPlaylists[2]);
                    else if (i === 4) openPlaylist(generatedPlaylists[3]);
                    else if (i === 5) openPlaylist(generatedPlaylists[4]);
                  }}
                  className="flex items-center gap-3 bg-[#ffffff12] rounded overflow-hidden hover:bg-[#ffffff20] transition-colors"
                >
                  <div className="w-12 h-12 bg-[#282828] flex items-center justify-center flex-shrink-0">
                    {item.img ? (
                      <img src={item.img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{item.icon}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold truncate pr-2">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Made For You */}
          <div className="px-4 mt-6">
            <h2 className="text-xl font-bold mb-4">Made For You</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {generatedPlaylists.slice(0, 4).map((pl) => (
                <button key={pl.id} onClick={() => openPlaylist(pl)} className="min-w-[150px] max-w-[150px] text-left group">
                  <div className="w-[150px] h-[150px] rounded-lg mb-2 flex items-center justify-center shadow-lg relative overflow-hidden" style={{ backgroundColor: pl.color }}>
                    {pl.songs[0]?.cover_url ? (
                      <img src={pl.songs[0].cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-12 h-12 text-white/40" />
                    )}
                    <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1db954] flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </div>
                  </div>
                  <p className="text-sm font-bold truncate">{pl.name}</p>
                  <p className="text-xs text-[#b3b3b3] truncate">{pl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recently Played */}
          <div className="px-4 mt-8">
            <h2 className="text-xl font-bold mb-4">Recently Played</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allArtists.slice(0, 6).map((artist) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="min-w-[130px] max-w-[130px] text-left">
                  <div className="w-[130px] h-[130px] rounded-full bg-[#282828] overflow-hidden mb-2 shadow-lg">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-10 h-10 text-[#b3b3b3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold truncate text-center">{artist.artist_name}</p>
                  <p className="text-xs text-[#b3b3b3] text-center">Artist</p>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Playlists */}
          <div className="px-4 mt-8">
            <h2 className="text-xl font-bold mb-4">Popular Playlists</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {generatedPlaylists.slice(1, 5).map((pl) => (
                <button key={pl.id} onClick={() => openPlaylist(pl)} className="min-w-[150px] max-w-[150px] text-left group">
                  <div className="w-[150px] h-[150px] rounded-lg mb-2 flex items-center justify-center shadow-lg" style={{ backgroundColor: pl.color }}>
                    <Music className="w-12 h-12 text-white/30" />
                  </div>
                  <p className="text-sm font-bold truncate">{pl.name}</p>
                  <p className="text-xs text-[#b3b3b3] truncate">{pl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Your Top Mixes */}
          <div className="px-4 mt-8 mb-6">
            <h2 className="text-xl font-bold mb-4">Your Top Mixes</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allArtists.slice(0, 4).map((artist, i) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="min-w-[150px] max-w-[150px] text-left group">
                  <div className="w-[150px] h-[150px] rounded-lg mb-2 overflow-hidden shadow-lg bg-gradient-to-br from-[#282828] to-[#181818] relative">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-12 h-12 text-[#b3b3b3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold truncate">{artist.artist_name} Mix</p>
                  <p className="text-xs text-[#b3b3b3] truncate">{artist.artist_name} and more</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'playlist' && viewingPlaylist && (
        <div>
          {/* Playlist header */}
          <div className="relative pt-8 pb-6 px-6" style={{ background: `linear-gradient(180deg, ${viewingPlaylist.color} 0%, #121212 100%)` }}>
            <div className="w-48 h-48 mx-auto rounded-lg shadow-2xl mb-6 flex items-center justify-center" style={{ backgroundColor: viewingPlaylist.color }}>
              {viewingPlaylist.songs[0]?.cover_url ? (
                <img src={viewingPlaylist.songs[0].cover_url} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Music className="w-16 h-16 text-white/40" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-center">{viewingPlaylist.name}</h1>
            <p className="text-sm text-[#b3b3b3] text-center mt-1">{viewingPlaylist.description}</p>
            <p className="text-xs text-[#b3b3b3] text-center mt-2">Spotify • {viewingPlaylist.songs.length} songs</p>
          </div>

          {/* Controls */}
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Heart className="w-5 h-5 text-[#1db954]" />
              <Plus className="w-5 h-5 text-[#b3b3b3]" />
            </div>
            <div className="flex items-center gap-4">
              <Shuffle className="w-5 h-5 text-[#b3b3b3]" />
              <div className="w-14 h-14 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg">
                <Play className="w-7 h-7 text-black ml-1" />
              </div>
            </div>
          </div>

          {/* Song list */}
          <div className="px-6">
            {viewingPlaylist.songs.map((song, i) => (
              <button
                key={song.id + i}
                onClick={() => playSong(song)}
                className="flex items-center gap-3 py-3 w-full text-left hover:bg-[#ffffff10] rounded px-2 -mx-2"
              >
                <span className="w-5 text-sm text-[#b3b3b3] text-right">{i + 1}</span>
                <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-4 h-4 text-[#b3b3b3]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${currentlyPlaying?.id === song.id ? 'text-[#1db954]' : ''}`}>{song.title}</p>
                  <p className="text-xs text-[#b3b3b3]">{song.artist_name}</p>
                </div>
                <span className="text-xs text-[#b3b3b3]">{formatNumber(song.streams)}</span>
              </button>
            ))}
            {viewingPlaylist.songs.length === 0 && (
              <p className="text-sm text-[#b3b3b3] py-4">No songs in this playlist yet</p>
            )}
          </div>
        </div>
      )}

      {section === 'artist' && (
        <div>
          {/* Artist hero */}
          <div className="relative h-64 bg-gradient-to-b from-[#535353] to-[#121212] flex items-end p-6">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-full bg-[#282828] overflow-hidden shadow-2xl flex-shrink-0">
                {viewingArtist.avatar_url ? (
                  <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-[#b3b3b3]" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-[#b3b3b3] mb-1">Artist</p>
                <h1 className="text-3xl font-bold">{viewingArtist.artist_name}</h1>
                <p className="text-sm text-[#b3b3b3] mt-1">
                  {formatNumber(viewingArtist.monthly_listeners)} monthly listeners
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 text-[#000] ml-1" />
            </div>
            <Shuffle className="w-5 h-5 text-[#b3b3b3]" />
          </div>

          {/* Popular songs */}
          <div className="px-6">
            <h3 className="text-base font-bold mb-3">Popular</h3>
            {songs.length > 0 ? (
              <div className="space-y-1">
                {songs.map((song, i) => (
                  <button
                    key={song.id}
                    onClick={() => playSong({ ...song, artist_name: viewingArtist.artist_name })}
                    className="flex items-center gap-3 py-2 hover:bg-[#1a1a1a] rounded px-2 -mx-2 w-full text-left"
                  >
                    <span className="w-5 text-sm text-[#b3b3b3] text-right">{i + 1}</span>
                    <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden flex-shrink-0">
                      {song.cover_url ? (
                        <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-[#b3b3b3]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${currentlyPlaying?.id === song.id ? 'text-[#1db954]' : ''}`}>{song.title}</p>
                      <p className="text-xs text-[#b3b3b3]">{formatNumber(song.streams)} streams</p>
                    </div>
                    <Clock className="w-3 h-3 text-[#b3b3b3]" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#b3b3b3]">No songs released yet</p>
            )}
          </div>

          {/* About */}
          <div className="px-6 mt-8">
            <h3 className="text-base font-bold mb-3">About</h3>
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <p className="text-sm text-[#b3b3b3]">{viewingArtist.bio || 'No bio yet.'}</p>
              <div className="mt-3 flex gap-4 text-xs text-[#b3b3b3]">
                <span>{formatNumber(viewingArtist.spotify_followers)} followers</span>
                <span>{formatNumber(viewingArtist.monthly_listeners)} monthly listeners</span>
              </div>
            </div>
          </div>

          {/* Fans also like */}
          <div className="px-6 mt-8">
            <h3 className="text-base font-bold mb-3">Fans also like</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allArtists.filter(a => a.id !== viewingArtist.id).slice(0, 5).map((a) => (
                <button key={a.id} onClick={() => openArtist(a)} className="flex flex-col items-center gap-2 min-w-[100px]">
                  <div className="w-20 h-20 rounded-full bg-[#282828] overflow-hidden">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-[#b3b3b3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center">{a.artist_name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Discography */}
          <div className="px-6 mt-8 mb-6">
            <h3 className="text-base font-bold mb-3">Discography</h3>
            <p className="text-sm text-[#b3b3b3]">No albums yet. Release music to build your discography!</p>
          </div>
        </div>
      )}

      {/* Now Playing Bar */}
      {currentlyPlaying && (
        <div className="fixed bottom-[52px] left-0 right-0 bg-[#181818] border-t border-[#282828] px-3 py-2 z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#282828] rounded overflow-hidden flex-shrink-0">
              {currentlyPlaying.cover_url ? (
                <img src={currentlyPlaying.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-4 h-4 text-[#b3b3b3]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-[#1db954]">{currentlyPlaying.title}</p>
              <p className="text-[10px] text-[#b3b3b3]">{currentlyPlaying.artist_name || viewingArtist.artist_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-[#b3b3b3]" />
              <button onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-1 h-0.5 bg-[#4d4d4d] rounded-full">
            <div className="h-full w-1/3 bg-[#1db954] rounded-full" />
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#282828] flex justify-around py-3 px-4 z-50">
        <button onClick={() => setSection('home')} className={`flex flex-col items-center gap-1 ${section === 'home' ? 'text-white' : 'text-[#b3b3b3]'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#b3b3b3]">
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Search</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#b3b3b3]">
          <Library className="w-5 h-5" />
          <span className="text-[10px]">Library</span>
        </button>
      </div>
    </div>
  );
}

function Bell(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}
