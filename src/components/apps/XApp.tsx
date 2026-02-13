import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Home, Search, Bell, Mail, User, Music, Heart, MessageCircle, Repeat2, Share, Bookmark, MoreHorizontal, Verified, X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

type Section = 'feed' | 'search' | 'profile';

const timeAgo = (i: number) => ['2m', '15m', '1h', '3h', '5h', '8h', '12h', '1d', '2d', '3d'][i % 10];

const postTemplates = [
  (name: string, streams: number) => `New music dropping soon 🎵 ${formatNumber(streams)} streams and counting! #NewMusic`,
  (_name: string) => `Studio session was insane today 🔥🎧 Can't wait for y'all to hear this`,
  (_name: string) => `Thank you to all my fans for the love and support 💜 More to come`,
  (_name: string, streams: number) => `Just hit ${formatNumber(streams)} total streams! We're just getting started 🚀`,
  (_name: string) => `Late night vibes in the studio 🌙🎤 Something special is cooking`,
  (_name: string) => `Grateful for every single listener. You all make this possible 🙏`,
  (_name: string) => `The album is almost done... who's ready? 👀🔥`,
  (_name: string) => `Just finished a crazy collab session. This one is different fr 💫`,
];

function getBoostAmount(likerFollowers: number): number {
  if (likerFollowers >= 10_000_000) return 500_000;
  if (likerFollowers >= 1_000_000) return 100_000;
  if (likerFollowers >= 100_000) return 50_000;
  if (likerFollowers >= 10_000) return 20_000;
  if (likerFollowers >= 1_000) return 5_000;
  return 1_000;
}

export default function XApp({ profile }: Props) {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('feed');
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('x_followers', { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data) {
          setAllArtists(data as Profile[]);
          const counts: Record<string, number> = {};
          (data as Profile[]).forEach(a => { counts[a.id] = Math.floor(a.x_followers * 0.05); });
          setLikeCounts(counts);
        }
      });
  }, []);

  const openProfile = (a: Profile) => { setViewingArtist(a); setSection('profile'); };

  const handleLike = async (artistId: string) => {
    if (likedPosts.has(artistId)) return;
    if (!profile) return;

    const boost = getBoostAmount(profile.x_followers);
    setLikedPosts(prev => new Set(prev).add(artistId));
    setLikeCounts(prev => ({ ...prev, [artistId]: (prev[artistId] || 0) + boost }));

    // Record the like in DB
    await supabase.from('post_likes').insert({
      liker_id: profile.id,
      liked_artist_id: artistId,
      boost_amount: boost,
    });

    // Update the liked artist's followers
    const artist = allArtists.find(a => a.id === artistId);
    if (artist) {
      await supabase.from('profiles').update({
        x_followers: artist.x_followers + Math.floor(boost * 0.1),
      }).eq('id', artistId);
    }

    toast.success(`+${formatNumber(boost)} likes boost! 🔥`);
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('artist_name', `%${q}%`).limit(10);
    if (data) setSearchResults(data as Profile[]);
  };

  return (
    <div className="min-h-screen bg-[#000] text-[#e7e9ea]">
      {section === 'feed' && (
        <div className="pb-20">
          <div className="border-b border-[#2f3336]">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#16181c] overflow-hidden">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-2" />}
              </div>
              <span className="text-xl font-bold">𝕏</span>
              <div className="w-8" />
            </div>
            <div className="flex">
              <button className="flex-1 py-3 text-sm font-bold text-center border-b-2 border-[#1d9bf0]">For you</button>
              <button className="flex-1 py-3 text-sm font-medium text-center text-[#71767b]">Following</button>
            </div>
          </div>

          <div className="divide-y divide-[#2f3336]">
            {allArtists.map((artist, idx) => (
              <div key={artist.id} className="p-4">
                <div className="flex gap-3">
                  <button onClick={() => openProfile(artist)} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden">
                      {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-[#71767b]" /></div>}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openProfile(artist)} className="font-bold text-sm hover:underline truncate">{artist.artist_name}</button>
                      {artist.x_followers > 1000 && <Verified className="w-4 h-4 text-[#1d9bf0] flex-shrink-0" />}
                      <span className="text-[#71767b] text-sm truncate">@{artist.artist_name.toLowerCase().replace(/\s/g, '')} · {timeAgo(idx)}</span>
                    </div>
                    <p className="text-sm mt-1">{postTemplates[idx % postTemplates.length](artist.artist_name, artist.total_streams)}</p>
                    
                    <div className="flex justify-between mt-3 max-w-[350px]">
                      <button className="flex items-center gap-1.5 text-[#71767b] text-xs hover:text-[#1d9bf0] group">
                        <MessageCircle className="w-4 h-4" />
                        <span>{Math.floor((likeCounts[artist.id] || 0) * 0.1)}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-[#71767b] text-xs hover:text-[#00ba7c] group">
                        <Repeat2 className="w-4 h-4" />
                        <span>{Math.floor((likeCounts[artist.id] || 0) * 0.3)}</span>
                      </button>
                      <button
                        onClick={() => handleLike(artist.id)}
                        className={`flex items-center gap-1.5 text-xs group ${likedPosts.has(artist.id) ? 'text-[#f91880]' : 'text-[#71767b] hover:text-[#f91880]'}`}
                      >
                        <Heart className={`w-4 h-4 ${likedPosts.has(artist.id) ? 'fill-[#f91880]' : ''}`} />
                        <span>{formatNumber(likeCounts[artist.id] || 0)}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-[#71767b] text-xs hover:text-[#1d9bf0]">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="flex items-center gap-1.5 text-[#71767b] text-xs hover:text-[#1d9bf0]">
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button className="text-[#71767b] self-start"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {allArtists.length === 0 && <div className="p-8 text-center text-[#71767b] text-sm">No posts yet</div>}
          </div>
        </div>
      )}

      {section === 'search' && (
        <div className="pb-20">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 bg-[#202327] rounded-full px-4 py-2.5">
              <Search className="w-4 h-4 text-[#71767b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search artists"
                className="bg-transparent text-sm text-white placeholder-[#71767b] outline-none flex-1"
                autoFocus
              />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}><X className="w-4 h-4 text-[#71767b]" /></button>}
            </div>
          </div>
          {searchResults.length > 0 ? (
            <div className="px-4 mt-2">
              {searchResults.map((artist) => (
                <button key={artist.id} onClick={() => openProfile(artist)} className="flex items-center gap-3 py-3 w-full text-left hover:bg-[#ffffff08] rounded px-2">
                  <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-3" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm">{artist.artist_name}</span>
                      {artist.x_followers > 1000 && <Verified className="w-4 h-4 text-[#1d9bf0]" />}
                    </div>
                    <p className="text-xs text-[#71767b]">@{artist.artist_name.toLowerCase().replace(/\s/g, '')} • {formatNumber(artist.x_followers)} followers</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="px-4 mt-8 text-center text-[#71767b] text-sm">No results for "{searchQuery}"</div>
          ) : (
            <div className="px-4 mt-4">
              <h3 className="font-bold text-xl mb-4">Trending Artists</h3>
              {allArtists.slice(0, 5).map((artist, i) => (
                <button key={artist.id} onClick={() => openProfile(artist)} className="flex items-center gap-3 py-3 w-full text-left">
                  <span className="text-sm text-[#71767b] w-5">{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-3" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{artist.artist_name}</p>
                    <p className="text-xs text-[#71767b]">{formatNumber(artist.x_followers)} followers</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'profile' && (
        <div className="pb-20">
          <div className="h-32 bg-gradient-to-r from-[#1d1d1d] to-[#2a2a2a]" />
          <div className="px-4 relative">
            <div className="flex justify-between items-start">
              <div className="w-20 h-20 rounded-full bg-[#16181c] border-4 border-[#000] overflow-hidden -mt-10 mb-3">
                {viewingArtist.avatar_url ? <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-[#71767b]" /></div>}
              </div>
              <button className="mt-3 border border-[#536471] rounded-full px-4 py-1.5 text-sm font-bold hover:bg-[#ffffff10]">Follow</button>
            </div>
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-xl">{viewingArtist.artist_name}</h2>
              {viewingArtist.x_followers > 1000 && <Verified className="w-5 h-5 text-[#1d9bf0]" />}
            </div>
            <p className="text-[#71767b] text-sm">@{viewingArtist.artist_name.toLowerCase().replace(/\s/g, '')}</p>
            <p className="text-sm mt-2">{viewingArtist.bio || '🎵 Artist | Music is life'}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span><strong>{Math.floor(Math.random() * 500)}</strong> <span className="text-[#71767b]">Following</span></span>
              <span><strong>{formatNumber(viewingArtist.x_followers)}</strong> <span className="text-[#71767b]">Followers</span></span>
            </div>
          </div>

          <div className="flex border-b border-[#2f3336] mt-4">
            {['Posts', 'Replies', 'Highlights', 'Media', 'Likes'].map((t, i) => (
              <button key={t} className={`flex-1 py-3 text-sm font-medium ${i === 0 ? 'text-white border-b-2 border-[#1d9bf0]' : 'text-[#71767b]'}`}>{t}</button>
            ))}
          </div>

          {/* Pinned + recent posts */}
          <div className="divide-y divide-[#2f3336]">
            <div className="p-4">
              <div className="flex items-center gap-1 text-xs text-[#71767b] mb-2 ml-12"><Music className="w-3 h-3" /> Pinned</div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                  {viewingArtist.avatar_url ? <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-3" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm">{viewingArtist.artist_name}</span>
                    {viewingArtist.x_followers > 1000 && <Verified className="w-4 h-4 text-[#1d9bf0]" />}
                  </div>
                  <p className="text-sm mt-1">🎵 New music coming soon. Stay tuned! {formatNumber(viewingArtist.total_streams)} streams and counting 🔥</p>
                  <div className="flex justify-between mt-3 max-w-[300px]">
                    <span className="text-[#71767b] text-xs flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {Math.floor(Math.random() * 100)}</span>
                    <span className="text-[#71767b] text-xs flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> {Math.floor(Math.random() * 500)}</span>
                    <button onClick={() => handleLike(viewingArtist.id)} className={`text-xs flex items-center gap-1 ${likedPosts.has(viewingArtist.id) ? 'text-[#f91880]' : 'text-[#71767b]'}`}>
                      <Heart className={`w-3.5 h-3.5 ${likedPosts.has(viewingArtist.id) ? 'fill-[#f91880]' : ''}`} /> {formatNumber(likeCounts[viewingArtist.id] || Math.floor(viewingArtist.x_followers * 0.05))}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Additional posts */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                    {viewingArtist.avatar_url ? <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-3" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm">{viewingArtist.artist_name}</span>
                      {viewingArtist.x_followers > 1000 && <Verified className="w-4 h-4 text-[#1d9bf0]" />}
                      <span className="text-[#71767b] text-sm">· {['3h', '1d', '2d'][i - 1]}</span>
                    </div>
                    <p className="text-sm mt-1">{postTemplates[i](viewingArtist.artist_name, viewingArtist.total_streams)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#000] border-t border-[#2f3336] flex justify-around py-3">
        <button onClick={() => setSection('feed')} className={section === 'feed' ? 'text-white' : 'text-[#71767b]'}>
          <Home className="w-6 h-6" />
        </button>
        <button onClick={() => setSection('search')} className={section === 'search' ? 'text-white' : 'text-[#71767b]'}>
          <Search className="w-6 h-6" />
        </button>
        <button className="text-[#71767b]"><Bell className="w-6 h-6" /></button>
        <button className="text-[#71767b]"><Mail className="w-6 h-6" /></button>
      </div>
    </div>
  );
}
