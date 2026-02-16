import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Newspaper, TrendingUp, Star, Music, Users, Flame, Globe } from 'lucide-react';

interface Props {
  profile: Profile;
}

interface NewsItem {
  id: string;
  headline: string;
  body: string;
  category: string;
  icon: any;
  color: string;
  time: string;
  avatar?: string | null;
}

const CATEGORIES = ['All', 'Trending', 'Releases', 'Charts', 'Milestones'];

export default function NewsApp({ profile }: Props) {
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    supabase.from('profiles').select('*').order('total_streams', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
    supabase.from('songs').select('*, profiles!songs_artist_id_fkey(artist_name, avatar_url)').order('streams', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setAllSongs(data); });
  }, []);

  // Generate dynamic news based on game state
  const generateNews = (): NewsItem[] => {
    const news: NewsItem[] = [];

    // Top artist milestones
    allArtists.forEach((artist, i) => {
      if (artist.total_streams >= 1000000) {
        news.push({ id: `milestone-${artist.id}`, headline: `${artist.artist_name} surpasses ${formatNumber(artist.total_streams)} total streams!`, body: `The artist continues their incredible rise in the music industry.`, category: 'Milestones', icon: Star, color: '#f59e0b', time: '1h ago', avatar: artist.avatar_url });
      }
      if (artist.monthly_listeners >= 10000) {
        news.push({ id: `listeners-${artist.id}`, headline: `${artist.artist_name} hits ${formatNumber(artist.monthly_listeners)} monthly listeners`, body: `Fan engagement continues to grow across platforms.`, category: 'Trending', icon: Users, color: '#8b5cf6', time: '2h ago', avatar: artist.avatar_url });
      }
      if (i === 0) {
        news.push({ id: `top-${artist.id}`, headline: `${artist.artist_name} claims #1 spot on STARDOM charts`, body: `With ${formatNumber(artist.total_streams)} streams, they dominate this week's charts.`, category: 'Charts', icon: Flame, color: '#ef4444', time: '30m ago', avatar: artist.avatar_url });
      }
    });

    // Song releases
    allSongs.slice(0, 5).forEach((song) => {
      news.push({ id: `song-${song.id}`, headline: `"${song.title}" by ${song.profiles?.artist_name} is trending`, body: `The track has accumulated ${formatNumber(song.streams)} streams since release.`, category: 'Releases', icon: Music, color: '#1db954', time: '3h ago', avatar: song.profiles?.avatar_url });
    });

    // Global events
    news.push({ id: 'global-1', headline: 'STARDOM Awards nominations announced', body: 'Artists across the platform await the results of this season\'s awards ceremony.', category: 'Trending', icon: Globe, color: '#0ea5e9', time: '5h ago' });
    news.push({ id: 'global-2', headline: 'New studio locations now available', body: 'Premium recording studios are now open for all artists.', category: 'Trending', icon: TrendingUp, color: '#10b981', time: '8h ago' });

    return news;
  };

  const allNews = generateNews();
  const filteredNews = activeCategory === 'All' ? allNews : allNews.filter(n => n.category === activeCategory);

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#0ea5e9]/20 to-[#0a0a0a] px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] flex items-center justify-center">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">STARDOM News</h1>
            <p className="text-xs text-white/60">Latest from the music world</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                activeCategory === cat ? 'bg-[#0ea5e9] text-white' : 'bg-[#1a1a1a] text-[#888]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Breaking news banner */}
      {allArtists.length > 0 && (
        <div className="mx-4 mb-4 bg-gradient-to-r from-[#dc2626] to-[#ef4444] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">BREAKING</span>
          </div>
          <p className="text-sm font-bold">{allArtists[0]?.artist_name} dominates with {formatNumber(allArtists[0]?.total_streams)} streams</p>
          <p className="text-xs text-white/70 mt-1">The charts are on fire this season</p>
        </div>
      )}

      {/* News feed */}
      <div className="px-4 space-y-3 pb-4">
        {filteredNews.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-start gap-3">
                {item.avatar ? (
                  <div className="w-10 h-10 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                    <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${item.color}20`, color: item.color }}>{item.category}</span>
                    <span className="text-[10px] text-[#888]">{item.time}</span>
                  </div>
                  <p className="text-sm font-bold leading-tight">{item.headline}</p>
                  <p className="text-xs text-[#888] mt-1">{item.body}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filteredNews.length === 0 && (
          <div className="text-center py-12 text-[#888]">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No news in this category yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
