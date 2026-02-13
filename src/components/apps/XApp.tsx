import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Home, Search, Bell, Mail, User, Music, Heart, MessageCircle, Repeat2, Share, Bookmark, MoreHorizontal, Verified, X, Send, ArrowLeft, Image, Smile, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

type Section = 'feed' | 'search' | 'profile' | 'notifications' | 'messages' | 'thread';

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

const commentTemplates = [
  '🔥🔥🔥', 'Can\'t wait!!!', 'You the GOAT 🐐', 'Drop it already!!', 'This gonna be insane',
  'W artist fr', 'Legend 💯', 'Need this rn', 'Been waiting for this', 'Take my money 💰',
  'Collab when? 👀', 'Your music saved my life fr', 'Most underrated artist', 'Play this at my funeral',
  'On repeat already 🔁', 'Certified classic incoming', 'The streets need this', 'Real recognize real 🤝',
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
  const [retweetedPosts, setRetweetedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [threadArtist, setThreadArtist] = useState<Profile | null>(null);
  const [threadPostIdx, setThreadPostIdx] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<Record<string, { name: string; text: string; time: string; avatar?: string }[]>>({});
  const [notifications, setNotifications] = useState<{ text: string; time: string; type: string }[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('x_followers', { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data) {
          setAllArtists(data as Profile[]);
          const counts: Record<string, number> = {};
          (data as Profile[]).forEach(a => { counts[a.id] = Math.floor(a.x_followers * 0.05); });
          setLikeCounts(counts);
          // Generate fake comments for each post
          const fakeReplies: Record<string, { name: string; text: string; time: string; avatar?: string }[]> = {};
          (data as Profile[]).forEach(a => {
            const numReplies = Math.floor(Math.random() * 4) + 1;
            fakeReplies[a.id] = Array.from({ length: numReplies }, (_, i) => {
              const commenter = data[Math.floor(Math.random() * data.length)] as Profile;
              return {
                name: commenter.artist_name,
                text: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
                time: timeAgo(i + 3),
                avatar: commenter.avatar_url || undefined,
              };
            });
          });
          setReplies(fakeReplies);
        }
      });
  }, []);

  const openProfile = (a: Profile) => { setViewingArtist(a); setSection('profile'); };
  
  const openThread = (artist: Profile, idx: number) => {
    setThreadArtist(artist);
    setThreadPostIdx(idx);
    setSection('thread');
  };

  const handleLike = async (artistId: string) => {
    if (likedPosts.has(artistId)) {
      setLikedPosts(prev => { const n = new Set(prev); n.delete(artistId); return n; });
      return;
    }
    const boost = getBoostAmount(profile.x_followers);
    setLikedPosts(prev => new Set(prev).add(artistId));
    setLikeCounts(prev => ({ ...prev, [artistId]: (prev[artistId] || 0) + boost }));
    await supabase.from('post_likes').insert({ liker_id: profile.id, liked_artist_id: artistId, boost_amount: boost });
    const artist = allArtists.find(a => a.id === artistId);
    if (artist) {
      await supabase.from('profiles').update({ x_followers: artist.x_followers + Math.floor(boost * 0.1) }).eq('id', artistId);
    }
    setNotifications(prev => [{ text: `You liked ${artist?.artist_name}'s post`, time: 'now', type: 'like' }, ...prev]);
    toast.success(`+${formatNumber(boost)} likes boost! 🔥`);
  };

  const handleRetweet = (artistId: string) => {
    if (retweetedPosts.has(artistId)) {
      setRetweetedPosts(prev => { const n = new Set(prev); n.delete(artistId); return n; });
      return;
    }
    setRetweetedPosts(prev => new Set(prev).add(artistId));
    const artist = allArtists.find(a => a.id === artistId);
    setNotifications(prev => [{ text: `You reposted ${artist?.artist_name}'s post`, time: 'now', type: 'retweet' }, ...prev]);
    toast.success('Reposted! 🔁');
  };

  const handleBookmark = (artistId: string) => {
    if (bookmarkedPosts.has(artistId)) {
      setBookmarkedPosts(prev => { const n = new Set(prev); n.delete(artistId); return n; });
      toast('Removed from bookmarks');
      return;
    }
    setBookmarkedPosts(prev => new Set(prev).add(artistId));
    toast.success('Added to bookmarks 🔖');
  };

  const handleShare = (artist: Profile) => {
    toast.success(`Link to ${artist.artist_name}'s post copied! 📋`);
  };

  const handleReply = (artistId: string) => {
    if (!replyText.trim()) return;
    setReplies(prev => ({
      ...prev,
      [artistId]: [...(prev[artistId] || []), { name: profile.artist_name, text: replyText, time: 'now', avatar: profile.avatar_url || undefined }],
    }));
    setReplyText('');
    toast.success('Reply posted! 💬');
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('artist_name', `%${q}%`).limit(10);
    if (data) setSearchResults(data as Profile[]);
  };

  const PostActions = ({ artist, idx }: { artist: Profile; idx: number }) => (
    <div className="flex justify-between mt-3 max-w-[350px]">
      <button onClick={() => openThread(artist, idx)} className="flex items-center gap-1.5 text-[#71767b] text-xs hover:text-[#1d9bf0] group">
        <MessageCircle className="w-4 h-4" />
        <span>{(replies[artist.id]?.length || 0)}</span>
      </button>
      <button onClick={() => handleRetweet(artist.id)} className={`flex items-center gap-1.5 text-xs group ${retweetedPosts.has(artist.id) ? 'text-[#00ba7c]' : 'text-[#71767b] hover:text-[#00ba7c]'}`}>
        <Repeat2 className="w-4 h-4" />
        <span>{Math.floor((likeCounts[artist.id] || 0) * 0.3) + (retweetedPosts.has(artist.id) ? 1 : 0)}</span>
      </button>
      <button onClick={() => handleLike(artist.id)} className={`flex items-center gap-1.5 text-xs group ${likedPosts.has(artist.id) ? 'text-[#f91880]' : 'text-[#71767b] hover:text-[#f91880]'}`}>
        <Heart className={`w-4 h-4 ${likedPosts.has(artist.id) ? 'fill-[#f91880]' : ''}`} />
        <span>{formatNumber(likeCounts[artist.id] || 0)}</span>
      </button>
      <button onClick={() => handleBookmark(artist.id)} className={`flex items-center gap-1.5 text-xs ${bookmarkedPosts.has(artist.id) ? 'text-[#1d9bf0]' : 'text-[#71767b] hover:text-[#1d9bf0]'}`}>
        <Bookmark className={`w-4 h-4 ${bookmarkedPosts.has(artist.id) ? 'fill-[#1d9bf0]' : ''}`} />
      </button>
      <button onClick={() => handleShare(artist)} className="flex items-center gap-1.5 text-[#71767b] text-xs hover:text-[#1d9bf0]">
        <Share className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000] text-[#e7e9ea]">
      {/* THREAD VIEW */}
      {section === 'thread' && threadArtist && (
        <div className="pb-20">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-[#2f3336]">
            <button onClick={() => setSection('feed')}><ArrowLeft className="w-5 h-5" /></button>
            <h2 className="font-bold text-lg">Post</h2>
          </div>
          <div className="p-4 border-b border-[#2f3336]">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                {threadArtist.avatar_url ? <img src={threadArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-3" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[15px]">{threadArtist.artist_name}</span>
                  {threadArtist.x_followers > 1000 && <Verified className="w-4 h-4 text-[#1d9bf0]" />}
                </div>
                <p className="text-[#71767b] text-sm">@{threadArtist.artist_name.toLowerCase().replace(/\s/g, '')}</p>
              </div>
            </div>
            <p className="text-[15px] mt-3 leading-relaxed">{postTemplates[threadPostIdx % postTemplates.length](threadArtist.artist_name, threadArtist.total_streams)}</p>
            <p className="text-[#71767b] text-sm mt-3">{timeAgo(threadPostIdx)} · <span className="text-[#e7e9ea] font-bold">{formatNumber((likeCounts[threadArtist.id] || 0) * 10)}</span> Views</p>
            <div className="border-t border-[#2f3336] mt-3 pt-3 flex gap-6 text-sm">
              <span><strong>{Math.floor((likeCounts[threadArtist.id] || 0) * 0.3)}</strong> <span className="text-[#71767b]">Reposts</span></span>
              <span><strong>{formatNumber(likeCounts[threadArtist.id] || 0)}</strong> <span className="text-[#71767b]">Likes</span></span>
              <span><strong>{replies[threadArtist.id]?.length || 0}</strong> <span className="text-[#71767b]">Replies</span></span>
            </div>
            <PostActions artist={threadArtist} idx={threadPostIdx} />
          </div>

          {/* Replies */}
          <div className="divide-y divide-[#2f3336]">
            {(replies[threadArtist.id] || []).map((reply, i) => (
              <div key={i} className="p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                  {reply.avatar ? <img src={reply.avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-[#71767b] m-2.5" />}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm">{reply.name}</span>
                    <span className="text-[#71767b] text-xs">· {reply.time}</span>
                  </div>
                  <p className="text-sm mt-0.5">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply input */}
          <div className="fixed bottom-[52px] left-0 right-0 bg-[#000] border-t border-[#2f3336] p-3 z-40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-[#71767b] m-2.5" />}
              </div>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply(threadArtist.id)}
                placeholder="Post your reply"
                className="flex-1 bg-transparent text-sm outline-none placeholder-[#71767b]"
              />
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-[#1d9bf0]" />
                <Smile className="w-4 h-4 text-[#1d9bf0]" />
                <button onClick={() => handleReply(threadArtist.id)} disabled={!replyText.trim()} className="bg-[#1d9bf0] text-white text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-50">
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEED */}
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
                      {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-3" />}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openProfile(artist)} className="font-bold text-sm hover:underline truncate">{artist.artist_name}</button>
                      {artist.x_followers > 1000 && <Verified className="w-4 h-4 text-[#1d9bf0] flex-shrink-0" />}
                      <span className="text-[#71767b] text-sm truncate">@{artist.artist_name.toLowerCase().replace(/\s/g, '')} · {timeAgo(idx)}</span>
                    </div>
                    <button onClick={() => openThread(artist, idx)} className="text-left w-full">
                      <p className="text-sm mt-1">{postTemplates[idx % postTemplates.length](artist.artist_name, artist.total_streams)}</p>
                    </button>
                    <PostActions artist={artist} idx={idx} />
                  </div>
                  <button className="text-[#71767b] self-start"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH */}
      {section === 'search' && (
        <div className="pb-20">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 bg-[#202327] rounded-full px-4 py-2.5">
              <Search className="w-4 h-4 text-[#71767b]" />
              <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search artists" className="bg-transparent text-sm text-white placeholder-[#71767b] outline-none flex-1" autoFocus />
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

      {/* NOTIFICATIONS */}
      {section === 'notifications' && (
        <div className="pb-20">
          <div className="px-4 py-3 border-b border-[#2f3336]">
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
          <div className="flex border-b border-[#2f3336]">
            <button className="flex-1 py-3 text-sm font-bold text-center border-b-2 border-[#1d9bf0]">All</button>
            <button className="flex-1 py-3 text-sm text-[#71767b]">Verified</button>
            <button className="flex-1 py-3 text-sm text-[#71767b]">Mentions</button>
          </div>
          {notifications.length > 0 ? (
            <div className="divide-y divide-[#2f3336]">
              {notifications.map((n, i) => (
                <div key={i} className="p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'like' ? 'bg-[#f91880]/20' : 'bg-[#00ba7c]/20'}`}>
                    {n.type === 'like' ? <Heart className="w-4 h-4 text-[#f91880]" /> : <Repeat2 className="w-4 h-4 text-[#00ba7c]" />}
                  </div>
                  <div>
                    <p className="text-sm">{n.text}</p>
                    <p className="text-xs text-[#71767b]">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[#71767b] text-sm">No notifications yet. Interact with posts to see activity here!</div>
          )}
        </div>
      )}

      {/* MESSAGES */}
      {section === 'messages' && (
        <div className="pb-20">
          <div className="px-4 py-3 border-b border-[#2f3336]">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          <div className="p-8 text-center">
            <Mail className="w-10 h-10 text-[#1d9bf0] mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-1">Welcome to your inbox!</h2>
            <p className="text-sm text-[#71767b]">Drop a line, share posts, and more with private conversations between you and others.</p>
            <button className="mt-4 bg-[#1d9bf0] text-white font-bold px-6 py-3 rounded-full text-sm">Write a message</button>
          </div>
        </div>
      )}

      {/* PROFILE */}
      {section === 'profile' && (
        <div className="pb-20">
          <div className="flex items-center gap-4 px-4 py-2 border-b border-[#2f3336]">
            <button onClick={() => setSection('feed')}><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h2 className="font-bold text-lg">{viewingArtist.artist_name}</h2>
              <p className="text-xs text-[#71767b]">{allArtists.findIndex(a => a.id === viewingArtist.id) >= 0 ? '4' : '0'} posts</p>
            </div>
          </div>
          <div className="h-32 bg-gradient-to-r from-[#1d1d1d] to-[#2a2a2a]" />
          <div className="px-4 relative">
            <div className="flex justify-between items-start">
              <div className="w-20 h-20 rounded-full bg-[#16181c] border-4 border-[#000] overflow-hidden -mt-10 mb-3">
                {viewingArtist.avatar_url ? <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-[#71767b] m-4" />}
              </div>
              <button className="mt-3 border border-[#536471] rounded-full px-4 py-1.5 text-sm font-bold hover:bg-[#ffffff10]">Follow</button>
            </div>
            <div className="flex items-center gap-1">
              <h2 className="font-bold text-xl">{viewingArtist.artist_name}</h2>
              {viewingArtist.x_followers > 1000 && <Verified className="w-5 h-5 text-[#1d9bf0]" />}
            </div>
            <p className="text-[#71767b] text-sm">@{viewingArtist.artist_name.toLowerCase().replace(/\s/g, '')}</p>
            <p className="text-sm mt-2">{viewingArtist.bio || '🎵 Artist | Music is life'}</p>
            <div className="flex items-center gap-1 text-[#71767b] text-sm mt-2">
              <MapPin className="w-3.5 h-3.5" /> Worldwide
            </div>
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
          <div className="divide-y divide-[#2f3336]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-4">
                {i === 0 && <div className="flex items-center gap-1 text-xs text-[#71767b] mb-2 ml-12"><Music className="w-3 h-3" /> Pinned</div>}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#16181c] overflow-hidden flex-shrink-0">
                    {viewingArtist.avatar_url ? <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#71767b] m-3" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm">{viewingArtist.artist_name}</span>
                      {viewingArtist.x_followers > 1000 && <Verified className="w-4 h-4 text-[#1d9bf0]" />}
                      <span className="text-[#71767b] text-sm">· {['just now', '3h', '1d', '2d'][i]}</span>
                    </div>
                    <button onClick={() => openThread(viewingArtist, i)} className="text-left w-full">
                      <p className="text-sm mt-1">{postTemplates[i](viewingArtist.artist_name, viewingArtist.total_streams)}</p>
                    </button>
                    <PostActions artist={viewingArtist} idx={i} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#000] border-t border-[#2f3336] flex justify-around py-3 z-50">
        <button onClick={() => setSection('feed')} className={section === 'feed' ? 'text-white' : 'text-[#71767b]'}>
          <Home className={`w-6 h-6 ${section === 'feed' ? 'fill-white' : ''}`} />
        </button>
        <button onClick={() => setSection('search')} className={section === 'search' ? 'text-white' : 'text-[#71767b]'}>
          <Search className="w-6 h-6" />
        </button>
        <button onClick={() => setSection('notifications')} className={`relative ${section === 'notifications' ? 'text-white' : 'text-[#71767b]'}`}>
          <Bell className={`w-6 h-6 ${section === 'notifications' ? 'fill-white' : ''}`} />
          {notifications.length > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#1d9bf0] rounded-full" />}
        </button>
        <button onClick={() => setSection('messages')} className={section === 'messages' ? 'text-white' : 'text-[#71767b]'}>
          <Mail className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
