import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Home, Search, Bell, Mail, User, Music, Heart, MessageCircle, Repeat2, Share } from 'lucide-react';

interface Props {
  profile: Profile;
}

type Section = 'feed' | 'profile';

export default function XApp({ profile }: Props) {
  const [section, setSection] = useState<Section>('feed');
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);

  useEffect(() => {
    supabase.from('profiles').select('*').order('x_followers', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
  }, []);

  const openProfile = (a: Profile) => { setViewingArtist(a); setSection('profile'); };

  return (
    <div className="min-h-screen bg-[#000] text-[#e7e9ea]">
      {section === 'feed' && (
        <div className="pb-20">
          {/* X header */}
          <div className="flex items-center justify-center py-3 border-b border-[#2f3336]">
            <span className="text-xl font-bold">𝕏</span>
          </div>

          {/* Feed: artist "posts" */}
          <div className="divide-y divide-[#2f3336]">
            {allArtists.map((artist) => (
              <div key={artist.id} className="p-4">
                <div className="flex gap-3">
                  <button onClick={() => openProfile(artist)} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden">
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-[#71767b]" />
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openProfile(artist)} className="font-bold text-sm hover:underline">{artist.artist_name}</button>
                      <span className="text-[#71767b] text-sm">@{artist.artist_name.toLowerCase().replace(/\s/g, '')}</span>
                    </div>
                    <p className="text-sm mt-1">Working on new music 🎵 {formatNumber(artist.total_streams)} total streams and counting!</p>
                    <div className="flex justify-between mt-3 max-w-xs">
                      <button className="flex items-center gap-1 text-[#71767b] text-xs hover:text-[#1d9bf0]">
                        <MessageCircle className="w-4 h-4" /> <span>0</span>
                      </button>
                      <button className="flex items-center gap-1 text-[#71767b] text-xs hover:text-[#00ba7c]">
                        <Repeat2 className="w-4 h-4" /> <span>0</span>
                      </button>
                      <button className="flex items-center gap-1 text-[#71767b] text-xs hover:text-[#f91880]">
                        <Heart className="w-4 h-4" /> <span>0</span>
                      </button>
                      <button className="flex items-center gap-1 text-[#71767b] text-xs hover:text-[#1d9bf0]">
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {allArtists.length === 0 && (
              <div className="p-8 text-center text-[#71767b] text-sm">No posts yet</div>
            )}
          </div>
        </div>
      )}

      {section === 'profile' && (
        <div className="pb-20">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-[#1d1d1d] to-[#2a2a2a]" />
          
          {/* Profile info */}
          <div className="px-4 relative">
            <div className="w-20 h-20 rounded-full bg-[#16181c] border-4 border-[#000] overflow-hidden -mt-10 mb-3">
              {viewingArtist.avatar_url ? (
                <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[#71767b]" />
                </div>
              )}
            </div>
            <h2 className="font-bold text-xl">{viewingArtist.artist_name}</h2>
            <p className="text-[#71767b] text-sm">@{viewingArtist.artist_name.toLowerCase().replace(/\s/g, '')}</p>
            <p className="text-sm mt-2">{viewingArtist.bio || '🎵 Artist'}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span><strong>{formatNumber(viewingArtist.x_followers)}</strong> <span className="text-[#71767b]">Followers</span></span>
              <span><strong>0</strong> <span className="text-[#71767b]">Following</span></span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2f3336] mt-4">
            {['Posts', 'Replies', 'Media', 'Likes'].map((t, i) => (
              <button key={t} className={`flex-1 py-3 text-sm font-medium ${i === 0 ? 'text-white border-b-2 border-[#1d9bf0]' : 'text-[#71767b]'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-6 text-center text-[#71767b] text-sm">
            No posts yet
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#000] border-t border-[#2f3336] flex justify-around py-3">
        <button onClick={() => setSection('feed')} className={section === 'feed' ? 'text-white' : 'text-[#71767b]'}>
          <Home className="w-6 h-6" />
        </button>
        <button className="text-[#71767b]"><Search className="w-6 h-6" /></button>
        <button className="text-[#71767b]"><Bell className="w-6 h-6" /></button>
        <button className="text-[#71767b]"><Mail className="w-6 h-6" /></button>
      </div>
    </div>
  );
}
