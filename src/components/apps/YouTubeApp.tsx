import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Home, Search, PlaySquare, Bell, User, Music, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';

interface Props {
  profile: Profile;
}

type Section = 'home' | 'channel';

export default function YouTubeApp({ profile }: Props) {
  const [section, setSection] = useState<Section>('home');
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);

  useEffect(() => {
    supabase.from('profiles').select('*').order('youtube_subscribers', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
  }, []);

  const openChannel = (a: Profile) => { setViewingArtist(a); setSection('channel'); };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#fff]">
      {/* YouTube header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-[#272727]">
        <div className="flex items-center gap-1">
          <div className="w-7 h-5 bg-[#ff0000] rounded-sm flex items-center justify-center">
            <PlaySquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-semibold ml-1">YouTube</span>
        </div>
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-[#aaa]" />
          <Bell className="w-5 h-5 text-[#aaa]" />
        </div>
      </div>

      {section === 'home' && (
        <div className="pb-20">
          {/* Category chips */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {['All', 'Music', 'Live', 'Gaming', 'News'].map((c) => (
              <div key={c} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                c === 'Music' ? 'bg-white text-black' : 'bg-[#272727] text-[#f1f1f1]'
              }`}>{c}</div>
            ))}
          </div>

          {/* Artist channels as "videos" */}
          <div className="space-y-6 px-4 pt-2">
            {allArtists.map((artist) => (
              <button key={artist.id} onClick={() => openChannel(artist)} className="w-full text-left">
                <div className="w-full aspect-video bg-[#272727] rounded-xl flex items-center justify-center mb-3">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Music className="w-12 h-12 text-[#555]" />
                  )}
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-[#aaa]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{artist.artist_name} - Official Channel</p>
                    <p className="text-xs text-[#aaa] mt-0.5">{artist.artist_name} • {formatNumber(artist.youtube_subscribers)} subscribers</p>
                  </div>
                </div>
              </button>
            ))}
            {allArtists.length === 0 && <p className="text-[#aaa] text-sm text-center py-8">No channels yet</p>}
          </div>
        </div>
      )}

      {section === 'channel' && (
        <div className="pb-20">
          {/* Channel banner */}
          <div className="h-24 bg-gradient-to-r from-[#272727] to-[#1a1a1a]" />

          {/* Channel info */}
          <div className="px-4 py-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
              {viewingArtist.avatar_url ? (
                <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[#aaa]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{viewingArtist.artist_name}</h2>
              <p className="text-xs text-[#aaa]">{formatNumber(viewingArtist.youtube_subscribers)} subscribers</p>
            </div>
            <button className="bg-[#ff0000] text-white text-sm font-medium px-4 py-2 rounded-full">
              Subscribe
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#272727] px-4">
            {['Videos', 'Shorts', 'Community', 'About'].map((t, i) => (
              <button key={t} className={`py-3 px-4 text-sm font-medium ${i === 0 ? 'text-white border-b-2 border-white' : 'text-[#aaa]'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-4 text-sm text-[#aaa]">
            <p>{viewingArtist.bio || 'No content yet. Release music to fill your channel!'}</p>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-[#272727] flex justify-around py-2">
        <button onClick={() => setSection('home')} className={`flex flex-col items-center gap-0.5 ${section === 'home' ? 'text-white' : 'text-[#aaa]'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-[#aaa]">
          <PlaySquare className="w-5 h-5" />
          <span className="text-[10px]">Shorts</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-[#aaa]">
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Explore</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-[#aaa]">
          <User className="w-5 h-5" />
          <span className="text-[10px]">You</span>
        </button>
      </div>
    </div>
  );
}
