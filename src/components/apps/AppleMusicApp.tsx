import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Search, Play, Music, Radio, LayoutGrid } from 'lucide-react';

interface Props {
  profile: Profile;
}

type Section = 'browse' | 'artist';

export default function AppleMusicApp({ profile }: Props) {
  const [section, setSection] = useState<Section>('browse');
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('monthly_listeners', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
  }, []);

  useEffect(() => {
    supabase.from('songs').select('*').eq('artist_id', viewingArtist.id).order('streams', { ascending: false })
      .then(({ data }) => { if (data) setSongs(data); });
  }, [viewingArtist.id]);

  const openArtist = (a: Profile) => { setViewingArtist(a); setSection('artist'); };

  return (
    <div className="min-h-screen bg-[#000] text-[#fff]">
      {section === 'browse' && (
        <div className="pb-24">
          {/* Header */}
          <div className="p-4 pt-2">
            <h1 className="text-3xl font-bold">Browse</h1>
          </div>

          {/* Search */}
          <div className="px-4 mb-6">
            <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-lg px-3 py-2.5">
              <Search className="w-4 h-4 text-[#8e8e93]" />
              <span className="text-sm text-[#8e8e93]">Artists, Songs, Albums</span>
            </div>
          </div>

          {/* Category pills */}
          <div className="px-4 flex gap-2 mb-6 overflow-x-auto">
            {['Top Artists', 'New Releases', 'Playlists'].map((cat) => (
              <div key={cat} className="px-4 py-1.5 rounded-full bg-[#ff375f]/10 text-[#ff375f] text-xs font-medium whitespace-nowrap">
                {cat}
              </div>
            ))}
          </div>

          {/* Artists list */}
          <div className="px-4">
            <h2 className="text-xl font-bold mb-4">Top Artists</h2>
            <div className="space-y-4">
              {allArtists.map((artist, i) => (
                <button
                  key={artist.id}
                  onClick={() => openArtist(artist)}
                  className="flex items-center gap-4 w-full text-left"
                >
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
              {allArtists.length === 0 && (
                <p className="text-[#8e8e93] text-sm">No artists yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {section === 'artist' && (
        <div className="pb-24">
          {/* Artist hero with red gradient */}
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
                <p className="text-sm text-[#8e8e93] mt-1">
                  {formatNumber(viewingArtist.apple_music_listeners)} Listeners
                </p>
              </div>
            </div>
          </div>

          {/* Play + shuffle */}
          <div className="px-6 py-4 flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#ff375f] rounded-lg py-3 font-semibold text-sm">
              <Play className="w-4 h-4" /> Play
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#1c1c1e] rounded-lg py-3 text-sm">
              Shuffle
            </button>
          </div>

          {/* Top songs */}
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

          {/* About */}
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
