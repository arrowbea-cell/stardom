import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Search, Play, Music, Radio, LayoutGrid, Heart, Shuffle, ListMusic } from 'lucide-react';

interface Props {
  profile: Profile;
}

type Section = 'listen' | 'browse' | 'artist';

export default function AppleMusicApp({ profile }: Props) {
  const [section, setSection] = useState<Section>('listen');
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);
  const [songs, setSongs] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('monthly_listeners', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
    supabase.from('songs').select('*').order('streams', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setAllSongs(data); });
  }, []);

  useEffect(() => {
    supabase.from('songs').select('*').eq('artist_id', viewingArtist.id).order('streams', { ascending: false })
      .then(({ data }) => { if (data) setSongs(data); });
  }, [viewingArtist.id]);

  const openArtist = (a: Profile) => { setViewingArtist(a); setSection('artist'); };

  return (
    <div className="min-h-screen bg-[#000] text-[#fff]">
      {section === 'listen' && (
        <div className="pb-24">
          <div className="p-4 pt-2">
            <h1 className="text-3xl font-bold">Listen Now</h1>
          </div>

          {/* Top Picks */}
          <div className="px-4 mb-6">
            <h2 className="text-xl font-bold mb-3">Top Picks</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allArtists.slice(0, 4).map((artist) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="min-w-[200px] text-left">
                  <div className="w-[200px] h-[200px] rounded-xl bg-gradient-to-br from-[#ff375f]/60 to-[#fc3c44]/20 overflow-hidden mb-2">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-12 h-12 text-[#8e8e93]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#8e8e93] uppercase">Featured Artist</p>
                  <p className="text-sm font-semibold">{artist.artist_name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recently Played */}
          <div className="px-4 mb-6">
            <h2 className="text-xl font-bold mb-3">Recently Played</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allArtists.slice(0, 6).map((artist) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="min-w-[140px]">
                  <div className="w-[140px] h-[140px] rounded-xl bg-[#1c1c1e] overflow-hidden mb-2">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-[#8e8e93]" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate">{artist.artist_name}</p>
                  <p className="text-xs text-[#8e8e93]">Artist</p>
                </button>
              ))}
            </div>
          </div>

          {/* Stations For You */}
          <div className="px-4 mb-6">
            <h2 className="text-xl font-bold mb-3">Stations For You</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {['Chill', 'Hits', 'New Music', 'Pop'].map((name, i) => (
                <div key={name} className="min-w-[140px]">
                  <div className="w-[140px] h-[140px] rounded-xl mb-2 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${['#fc3c44','#af52de','#ff9f0a','#30d158'][i]}, ${['#ff6b6b','#5856d6','#ff375f','#34c759'][i]})` }}>
                    <Radio className="w-10 h-10 text-white/60" />
                  </div>
                  <p className="text-sm font-semibold">{name} Station</p>
                  <p className="text-xs text-[#8e8e93]">Apple Music</p>
                </div>
              ))}
            </div>
          </div>

          {/* New Releases */}
          <div className="px-4 mb-6">
            <h2 className="text-xl font-bold mb-3">New Releases</h2>
            {allSongs.slice(0, 5).map((song: any, i: number) => {
              const artist = allArtists.find(a => a.id === song.artist_id);
              return (
                <div key={song.id} className="flex items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded-lg bg-[#1c1c1e] overflow-hidden flex-shrink-0">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-[#8e8e93]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-[#8e8e93]">{artist?.artist_name || 'Unknown'}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-[#ff375f]/20 flex items-center justify-center">
                    <Play className="w-3 h-3 text-[#ff375f] ml-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {section === 'browse' && (
        <div className="pb-24">
          <div className="p-4 pt-2">
            <h1 className="text-3xl font-bold">Browse</h1>
          </div>
          <div className="px-4 mb-6">
            <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-lg px-3 py-2.5">
              <Search className="w-4 h-4 text-[#8e8e93]" />
              <span className="text-sm text-[#8e8e93]">Artists, Songs, Albums</span>
            </div>
          </div>
          <div className="px-4 flex gap-2 mb-6 overflow-x-auto">
            {['Top Artists', 'New Releases', 'Playlists'].map((cat) => (
              <div key={cat} className="px-4 py-1.5 rounded-full bg-[#ff375f]/10 text-[#ff375f] text-xs font-medium whitespace-nowrap">
                {cat}
              </div>
            ))}
          </div>
          <div className="px-4">
            <h2 className="text-xl font-bold mb-4">Top Artists</h2>
            <div className="space-y-4">
              {allArtists.map((artist, i) => (
                <button key={artist.id} onClick={() => openArtist(artist)} className="flex items-center gap-4 w-full text-left">
                  <span className="text-sm text-[#8e8e93] w-5 text-right">{i + 1}</span>
                  <div className="w-14 h-14 rounded-lg bg-[#1c1c1e] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-[#8e8e93]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{artist.artist_name}</p>
                    <p className="text-xs text-[#8e8e93]">{formatNumber(artist.apple_music_listeners)} listeners</p>
                  </div>
                </button>
              ))}
              {allArtists.length === 0 && <p className="text-[#8e8e93] text-sm">No artists yet</p>}
            </div>
          </div>
        </div>
      )}

      {section === 'artist' && (
        <div className="pb-24">
          <div className="relative h-72 bg-gradient-to-b from-[#ff375f]/40 to-[#000] flex items-end p-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-[#1c1c1e] overflow-hidden shadow-2xl flex-shrink-0">
                {viewingArtist.avatar_url ? (
                  <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-10 h-10 text-[#8e8e93]" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{viewingArtist.artist_name}</h1>
                <p className="text-sm text-[#8e8e93] mt-1">{formatNumber(viewingArtist.apple_music_listeners)} Listeners</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#ff375f] rounded-lg py-3 font-semibold text-sm">
              <Play className="w-4 h-4" /> Play
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1e] rounded-lg py-3 text-sm">
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
          </div>
          <div className="px-6">
            <h3 className="text-lg font-bold mb-3">Top Songs</h3>
            {songs.length > 0 ? (
              <div className="space-y-3">
                {songs.map((song: any, i: number) => (
                  <div key={song.id} className="flex items-center gap-3">
                    <span className="w-5 text-sm text-[#8e8e93] text-right">{i + 1}</span>
                    <div className="w-12 h-12 rounded-lg bg-[#1c1c1e] overflow-hidden flex-shrink-0">
                      {song.cover_url ? (
                        <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-[#8e8e93]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{song.title}</p>
                      <p className="text-xs text-[#8e8e93]">{formatNumber(song.streams)} plays</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8e8e93]">No songs yet</p>
            )}
          </div>

          {/* Similar Artists */}
          <div className="px-6 mt-8">
            <h3 className="text-lg font-bold mb-3">Similar Artists</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allArtists.filter(a => a.id !== viewingArtist.id).slice(0, 5).map((a) => (
                <button key={a.id} onClick={() => openArtist(a)} className="flex flex-col items-center gap-2 min-w-[90px]">
                  <div className="w-[80px] h-[80px] rounded-full bg-[#1c1c1e] overflow-hidden">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-[#8e8e93]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center truncate w-full">{a.artist_name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 mt-8">
            <h3 className="text-lg font-bold mb-3">About</h3>
            <div className="bg-[#1c1c1e] rounded-xl p-4">
              <p className="text-sm text-[#8e8e93]">{viewingArtist.bio || 'No bio available.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#000]/95 backdrop-blur-lg border-t border-[#1c1c1e] flex justify-around py-3">
        <button onClick={() => setSection('listen')} className={`flex flex-col items-center gap-1 ${section === 'listen' ? 'text-[#ff375f]' : 'text-[#8e8e93]'}`}>
          <ListMusic className="w-5 h-5" />
          <span className="text-[10px]">Listen Now</span>
        </button>
        <button onClick={() => setSection('browse')} className={`flex flex-col items-center gap-1 ${section === 'browse' ? 'text-[#ff375f]' : 'text-[#8e8e93]'}`}>
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">Browse</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#8e8e93]">
          <Radio className="w-5 h-5" />
          <span className="text-[10px]">Radio</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#8e8e93]">
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Search</span>
        </button>
      </div>
    </div>
  );
}
