import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Home, Search, PlaySquare, Bell, User, Music, ThumbsUp, ThumbsDown, Share2, Play, X } from 'lucide-react';

interface Props {
  profile: Profile;
}

type Section = 'home' | 'search' | 'shorts' | 'channel';

export default function YouTubeApp({ profile }: Props) {
  const [section, setSection] = useState<Section>('home');
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [viewingArtist, setViewingArtist] = useState<Profile>(profile);
  const [songs, setSongs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.from('profiles').select('*').order('youtube_subscribers', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
  }, []);

  useEffect(() => {
    supabase.from('songs').select('*').eq('artist_id', viewingArtist.id).order('streams', { ascending: false })
      .then(({ data }) => { if (data) setSongs(data); });
  }, [viewingArtist.id]);

  const openChannel = (a: Profile) => { setViewingArtist(a); setSection('channel'); };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('artist_name', `%${q}%`).limit(10);
    if (data) setSearchResults(data as Profile[]);
  };

  const toggleSubscribe = (id: string) => {
    setSubscribed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#fff]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border-b border-[#272727]">
        <div className="flex items-center gap-1">
          <div className="w-7 h-5 bg-[#ff0000] rounded-sm flex items-center justify-center">
            <PlaySquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-semibold ml-1">YouTube</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setSection('search')}><Search className="w-5 h-5 text-[#aaa]" /></button>
          <Bell className="w-5 h-5 text-[#aaa]" />
        </div>
      </div>

      {section === 'home' && (
        <div className="pb-20">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {['All', 'Music', 'Live', 'Gaming', 'Mixes', 'Podcasts'].map((c) => (
              <div key={c} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${c === 'Music' ? 'bg-white text-black' : 'bg-[#272727] text-[#f1f1f1]'}`}>{c}</div>
            ))}
          </div>

          {/* Shorts row */}
          <div className="px-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-[#ff0000] rounded px-1.5 py-0.5"><span className="text-[10px] font-bold">Shorts</span></div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allArtists.slice(0, 5).map((artist) => (
                <button key={artist.id} onClick={() => openChannel(artist)} className="min-w-[110px]">
                  <div className="w-[110px] h-[196px] rounded-xl bg-[#272727] overflow-hidden relative">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-8 h-8 text-[#555]" /></div>}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[10px] font-medium leading-tight line-clamp-2">{artist.artist_name} - Music Short</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Video feed */}
          <div className="space-y-6 px-4 pt-2">
            {allArtists.map((artist) => (
              <button key={artist.id} onClick={() => openChannel(artist)} className="w-full text-left">
                <div className="w-full aspect-video bg-[#272727] rounded-xl flex items-center justify-center mb-3 relative overflow-hidden">
                  {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" /> : <Music className="w-12 h-12 text-[#555]" />}
                  <div className="absolute bottom-2 right-2 bg-black/80 rounded px-1.5 py-0.5"><span className="text-[10px] font-medium">3:45</span></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#aaa] m-2.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{artist.artist_name} - Official Music Video</p>
                    <p className="text-xs text-[#aaa] mt-0.5">{artist.artist_name} • {formatNumber(artist.total_streams)} views • 1 day ago</p>
                  </div>
                </div>
              </button>
            ))}
            {allArtists.length === 0 && <p className="text-[#aaa] text-sm text-center py-8">No channels yet</p>}
          </div>
        </div>
      )}

      {/* SEARCH */}
      {section === 'search' && (
        <div className="pb-20">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 bg-[#272727] rounded-full px-4 py-2.5">
              <Search className="w-4 h-4 text-[#aaa]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search YouTube"
                className="bg-transparent text-sm text-white placeholder-[#aaa] outline-none flex-1"
                autoFocus
              />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}><X className="w-4 h-4 text-[#aaa]" /></button>}
            </div>
          </div>
          {searchResults.length > 0 ? (
            <div className="px-4 mt-2">
              {searchResults.map((artist) => (
                <button key={artist.id} onClick={() => openChannel(artist)} className="flex items-center gap-3 py-3 w-full text-left">
                  <div className="w-12 h-12 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                    {artist.avatar_url ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#aaa] m-3.5" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{artist.artist_name}</p>
                    <p className="text-xs text-[#aaa]">{formatNumber(artist.youtube_subscribers)} subscribers</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="px-4 mt-8 text-center text-[#aaa] text-sm">No results for "{searchQuery}"</div>
          ) : (
            <div className="px-4 mt-4">
              <h3 className="font-bold text-lg mb-3">Trending Channels</h3>
              {allArtists.slice(0, 5).map((a) => (
                <button key={a.id} onClick={() => openChannel(a)} className="flex items-center gap-3 py-3 w-full text-left">
                  <div className="w-10 h-10 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-[#aaa] m-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.artist_name}</p>
                    <p className="text-xs text-[#aaa]">{formatNumber(a.youtube_subscribers)} subscribers</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHANNEL */}
      {section === 'channel' && (
        <div className="pb-20">
          <div className="h-24 bg-gradient-to-r from-[#272727] to-[#1a1a1a]" />
          <div className="px-4 py-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#272727] overflow-hidden flex-shrink-0">
              {viewingArtist.avatar_url ? <img src={viewingArtist.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-[#aaa] m-5" />}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{viewingArtist.artist_name}</h2>
              <p className="text-xs text-[#aaa]">@{viewingArtist.artist_name.toLowerCase().replace(/\s/g, '')} • {formatNumber(viewingArtist.youtube_subscribers)} subscribers</p>
              <p className="text-xs text-[#aaa] mt-0.5">{viewingArtist.bio?.slice(0, 60) || 'Music artist'}</p>
            </div>
          </div>
          <div className="px-4 mb-4">
            <button
              onClick={() => toggleSubscribe(viewingArtist.id)}
              className={`text-sm font-medium px-6 py-2.5 rounded-full w-full ${subscribed.has(viewingArtist.id) ? 'bg-[#272727] text-[#aaa]' : 'bg-[#ff0000] text-white'}`}
            >
              {subscribed.has(viewingArtist.id) ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
          <div className="flex border-b border-[#272727] px-4 overflow-x-auto">
            {['Home', 'Videos', 'Shorts', 'Community', 'About'].map((t, i) => (
              <button key={t} className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${i === 0 ? 'text-white border-b-2 border-white' : 'text-[#aaa]'}`}>{t}</button>
            ))}
          </div>
          <div className="p-4 space-y-4">
            <h3 className="text-base font-bold">Videos</h3>
            {songs.length > 0 ? songs.map((song: any) => (
              <div key={song.id} className="flex gap-3">
                <div className="w-40 aspect-video bg-[#272727] rounded-lg overflow-hidden flex-shrink-0 relative">
                  {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-[#555]" /></div>}
                  <div className="absolute bottom-1 right-1 bg-black/80 rounded px-1 py-0.5"><span className="text-[9px]">3:30</span></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-2">{song.title} - Official Video</p>
                  <p className="text-xs text-[#aaa] mt-1">{formatNumber(song.streams)} views</p>
                  <p className="text-xs text-[#aaa]">2 days ago</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[#aaa]">No videos uploaded yet</p>
            )}
          </div>

          {/* Recommended channels */}
          <div className="px-4 mt-4">
            <h3 className="text-base font-bold mb-3">Recommended Channels</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {allArtists.filter(a => a.id !== viewingArtist.id).slice(0, 5).map((a) => (
                <button key={a.id} onClick={() => openChannel(a)} className="flex flex-col items-center gap-2 min-w-[90px]">
                  <div className="w-[70px] h-[70px] rounded-full bg-[#272727] overflow-hidden">
                    {a.avatar_url ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#aaa] m-5" />}
                  </div>
                  <p className="text-[11px] text-center truncate w-full">{a.artist_name}</p>
                  <p className="text-[10px] text-[#aaa]">{formatNumber(a.youtube_subscribers)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-[#272727] flex justify-around py-2 z-50">
        <button onClick={() => setSection('home')} className={`flex flex-col items-center gap-0.5 ${section === 'home' ? 'text-white' : 'text-[#aaa]'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => setSection('search')} className={`flex flex-col items-center gap-0.5 ${section === 'search' ? 'text-white' : 'text-[#aaa]'}`}>
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Explore</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-[#aaa]">
          <PlaySquare className="w-5 h-5" />
          <span className="text-[10px]">Shorts</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-[#aaa]">
          <User className="w-5 h-5" />
          <span className="text-[10px]">You</span>
        </button>
      </div>
    </div>
  );
}
