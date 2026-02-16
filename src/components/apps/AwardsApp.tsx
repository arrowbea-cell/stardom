import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Trophy, Award, Crown, Star, Medal, Sparkles, Music } from 'lucide-react';

interface Props {
  profile: Profile;
}

const AWARD_CATEGORIES = [
  { name: 'Best New Artist', icon: Star, requirement: 'Most streams as a newer artist', color: '#f59e0b' },
  { name: 'Song of the Year', icon: Music, requirement: 'Highest streamed single', color: '#ef4444' },
  { name: 'Album of the Year', icon: Award, requirement: 'Best performing album', color: '#8b5cf6' },
  { name: 'Most Streamed', icon: Crown, requirement: 'Highest total streams', color: '#1db954' },
  { name: 'Fan Favorite', icon: Medal, requirement: 'Most monthly listeners', color: '#ec4899' },
  { name: 'Global Icon', icon: Sparkles, requirement: 'Highest combined platform following', color: '#0ea5e9' },
];

export default function AwardsApp({ profile }: Props) {
  const [allArtists, setAllArtists] = useState<Profile[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [tab, setTab] = useState<'ceremony' | 'my-awards'>('ceremony');

  useEffect(() => {
    supabase.from('profiles').select('*').order('total_streams', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllArtists(data as Profile[]); });
    supabase.from('songs').select('*, profiles!songs_artist_id_fkey(artist_name, avatar_url)').order('streams', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setAllSongs(data); });
    supabase.from('awards').select('*').eq('artist_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAwards(data); });
  }, [profile.id]);

  // Calculate nominees for each category
  const getNominees = (category: string) => {
    switch (category) {
      case 'Most Streamed':
        return allArtists.slice(0, 5).map(a => ({ name: a.artist_name, value: formatNumber(a.total_streams) + ' streams', avatar: a.avatar_url, isWinner: a.id === allArtists[0]?.id, isYou: a.id === profile.id }));
      case 'Fan Favorite':
        return [...allArtists].sort((a, b) => b.monthly_listeners - a.monthly_listeners).slice(0, 5).map((a, i) => ({ name: a.artist_name, value: formatNumber(a.monthly_listeners) + ' listeners', avatar: a.avatar_url, isWinner: i === 0, isYou: a.id === profile.id }));
      case 'Song of the Year':
        return allSongs.slice(0, 5).map((s, i) => ({ name: s.title, value: `${s.profiles?.artist_name} • ${formatNumber(s.streams)} streams`, avatar: s.cover_url, isWinner: i === 0, isYou: s.artist_id === profile.id }));
      case 'Global Icon':
        return [...allArtists].sort((a, b) => (b.spotify_followers + b.youtube_subscribers + b.x_followers) - (a.spotify_followers + a.youtube_subscribers + a.x_followers)).slice(0, 5).map((a, i) => ({ name: a.artist_name, value: formatNumber(a.spotify_followers + a.youtube_subscribers + a.x_followers) + ' total following', avatar: a.avatar_url, isWinner: i === 0, isYou: a.id === profile.id }));
      case 'Best New Artist':
        return [...allArtists].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((a, i) => ({ name: a.artist_name, value: formatNumber(a.total_streams) + ' streams', avatar: a.avatar_url, isWinner: i === 0, isYou: a.id === profile.id }));
      default:
        return allArtists.slice(0, 5).map((a, i) => ({ name: a.artist_name, value: formatNumber(a.total_streams) + ' streams', avatar: a.avatar_url, isWinner: i === 0, isYou: a.id === profile.id }));
    }
  };

  const myWins = AWARD_CATEGORIES.filter(cat => {
    const nominees = getNominees(cat.name);
    return nominees.some(n => n.isYou && n.isWinner);
  });

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#f59e0b]/20 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold">STARDOM Awards</h1>
            <p className="text-xs text-white/60">{myWins.length} award{myWins.length !== 1 ? 's' : ''} won</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#222] mx-4">
        <button onClick={() => setTab('ceremony')} className={`flex-1 py-3 text-sm font-medium ${tab === 'ceremony' ? 'text-white border-b-2 border-[#f59e0b]' : 'text-[#888]'}`}>
          Ceremony
        </button>
        <button onClick={() => setTab('my-awards')} className={`flex-1 py-3 text-sm font-medium ${tab === 'my-awards' ? 'text-white border-b-2 border-[#f59e0b]' : 'text-[#888]'}`}>
          My Awards ({myWins.length})
        </button>
      </div>

      {tab === 'ceremony' && (
        <div className="px-4 py-4 space-y-4">
          {AWARD_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const nominees = getNominees(cat.name);
            return (
              <div key={cat.name} className="bg-[#1a1a1a] rounded-xl overflow-hidden">
                <div className="p-4 flex items-center gap-3" style={{ borderLeft: `3px solid ${cat.color}` }}>
                  <Icon className="w-5 h-5" style={{ color: cat.color }} />
                  <div>
                    <h3 className="font-bold text-sm">{cat.name}</h3>
                    <p className="text-[10px] text-[#888]">{cat.requirement}</p>
                  </div>
                </div>
                <div className="px-4 pb-3 space-y-1.5">
                  {nominees.map((nom, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      nom.isWinner ? 'bg-[#f59e0b]/10 ring-1 ring-[#f59e0b]/30' : ''
                    } ${nom.isYou ? 'ring-1 ring-primary/30' : ''}`}>
                      <span className="text-xs text-[#888] w-4">{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
                        {nom.avatar ? <img src={nom.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">🎵</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {nom.name} {nom.isYou && <span className="text-primary">(You)</span>}
                        </p>
                        <p className="text-[10px] text-[#888]">{nom.value}</p>
                      </div>
                      {nom.isWinner && <Trophy className="w-4 h-4 text-[#f59e0b]" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'my-awards' && (
        <div className="px-4 py-4 space-y-3">
          {myWins.length > 0 ? myWins.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.name} className="bg-gradient-to-r from-[#f59e0b]/10 to-transparent rounded-xl p-4 flex items-center gap-4 ring-1 ring-[#f59e0b]/20">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${cat.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: cat.color }} />
                </div>
                <div>
                  <p className="font-bold text-sm">{cat.name}</p>
                  <p className="text-xs text-[#f59e0b]">🏆 Winner</p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12 text-[#888]">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No awards yet</p>
              <p className="text-xs mt-1">Keep grinding to earn your first award!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
