import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Search, Home, Library, ChevronRight, Play, Clock, Music } from 'lucide-react';

interface Props {
  profile: Profile;
}

interface Song {
  id: string;
  title: string;
  cover_url: string | null;
  streams: number;
}

type SpotifySection = 'home' | 'artist';

export default function SpotifyApp({ profile }: Props) {
  const [section, setSection] = useState<SpotifySection>('home');
  const [songs, setSongs] = useState<Song[]>([]);
  const [allArtists, setAllArtists] = useState<Profile[]>([]);

  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);

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

  const openArtist = (artist: Profile) => {
    setViewingArtist(artist);
    setSection('artist');
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#fff]">
      {section === 'home' && (
        <div className="pb-20">
          {/* Spotify search bar */}
          <div className="p-4">
            <div className="flex items-center gap-2 bg-[#242424] rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-[#b3b3b3]" />
              <span className="text-sm text-[#b3b3b3]">Search</span>
            </div>
          </div>

          {/* Your profile section */}
          <div className="px-4 mb-6">
            <h2 className="text-lg font-bold mb-4">Your Profile</h2>
            <button onClick={() => openArtist(profile)} className="flex items-center gap-3 w-full text-left">
              <div className="w-14 h-14 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-6 h-6 text-[#b3b3b3]" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{profile.artist_name}</p>
                <p className="text-xs text-[#b3b3b3]">{formatNumber(profile.monthly_listeners)} monthly listeners</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#b3b3b3]" />
            </button>
          </div>

          {/* Other Artists */}
          <div className="px-4">
            <h2 className="text-lg font-bold mb-4">Artists</h2>
            <div className="space-y-3">
              {allArtists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => openArtist(artist)}
                  className="flex items-center gap-3 w-full text-left hover:bg-[#1a1a1a] rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-[#b3b3b3]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{artist.artist_name}</p>
                    <p className="text-xs text-[#b3b3b3]">{formatNumber(artist.monthly_listeners)} monthly listeners</p>
                  </div>
                </button>
              ))}
              {allArtists.length === 0 && (
                <p className="text-[#b3b3b3] text-sm">No artists yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {section === 'artist' && (
        <div className="pb-20">
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

          {/* Play button */}
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1db954] flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 text-[#000] ml-1" />
            </div>
          </div>

          {/* Popular songs */}
          <div className="px-6">
            <h3 className="text-base font-bold mb-3">Popular</h3>
            {songs.length > 0 ? (
              <div className="space-y-2">
                {songs.map((song, i) => (
                  <div key={song.id} className="flex items-center gap-3 py-2 hover:bg-[#1a1a1a] rounded px-2 -mx-2">
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
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-[#b3b3b3]">{formatNumber(song.streams)} streams</p>
                    </div>
                    <span className="text-xs text-[#b3b3b3]">
                      <Clock className="w-3 h-3" />
                    </span>
                  </div>
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
              <p className="text-sm text-[#b3b3b3]">
                {viewingArtist.bio || 'No bio yet.'}
              </p>
              <div className="mt-3 flex gap-4 text-xs text-[#b3b3b3]">
                <span>{formatNumber(viewingArtist.spotify_followers)} followers</span>
                <span>{formatNumber(viewingArtist.monthly_listeners)} monthly listeners</span>
              </div>
            </div>
          </div>

          {/* Artist similar */}
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

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#282828] flex justify-around py-3 px-4">
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
