import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/supabase-helpers';
import { Star, BookOpen, TrendingUp, Music, User, Search, X } from 'lucide-react';

interface Props {
  profile: Profile;
}

interface Review {
  id: string;
  artist_id: string;
  song_id: string | null;
  album_id: string | null;
  score: number;
  review_text: string;
  reviewer_name: string;
  turn_number: number;
  created_at: string;
  artist_name?: string;
  song_title?: string;
  album_title?: string;
}

const REVIEW_ADJECTIVES: Record<string, string[]> = {
  masterpiece: ['transcendent', 'genre-defining', 'a masterclass in artistry', 'an instant classic', 'breathtaking in scope'],
  great: ['compelling', 'assured and polished', 'a confident artistic statement', 'deeply rewarding', 'richly textured'],
  good: ['solid effort', 'shows real promise', 'engaging throughout', 'a step in the right direction', 'pleasantly surprising'],
  average: ['uneven but has moments', 'adequate but unremarkable', 'competent if familiar', 'neither thrilling nor disappointing'],
  poor: ['falls short of expectations', 'struggles to find its voice', 'derivative and uninspired', 'a missed opportunity'],
};

const REVIEWER_NAMES = ['Jayson Greene', 'Jenn Pelly', 'Ian Cohen', 'Sheldon Pearce', 'Dani Blum', 'Andy Beta', 'Allison Hussey', 'Philip Sherburne'];

function generateReview(artistName: string, title: string, score: number): string {
  let tier: string;
  if (score >= 9.0) tier = 'masterpiece';
  else if (score >= 7.5) tier = 'great';
  else if (score >= 6.0) tier = 'good';
  else if (score >= 4.0) tier = 'average';
  else tier = 'poor';
  
  const adj = REVIEW_ADJECTIVES[tier];
  const pick = adj[Math.floor(Math.random() * adj.length)];
  return `${artistName}'s "${title}" is ${pick}. ${score >= 7 ? 'Best New Music.' : ''}`;
}

export default function PitchforkApp({ profile }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'latest' | 'best' | 'yours'>('latest');

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('pitchfork_reviews')
        .select('*, profiles!pitchfork_reviews_artist_id_fkey(artist_name), songs!pitchfork_reviews_song_id_fkey(title), albums!pitchfork_reviews_album_id_fkey(title)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        setReviews(data.map((r: any) => ({
          ...r,
          artist_name: r.profiles?.artist_name || 'Unknown',
          song_title: r.songs?.title || null,
          album_title: r.albums?.title || null,
        })));
      }
    };
    fetchReviews();
  }, []);

  const filtered = reviews.filter(r => {
    if (tab === 'yours') return r.artist_id === profile.id;
    if (tab === 'best') return r.score >= 8.0;
    return true;
  }).filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.artist_name?.toLowerCase().includes(q) || r.song_title?.toLowerCase().includes(q) || r.album_title?.toLowerCase().includes(q);
  });

  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'bg-[#00c853] text-white';
    if (score >= 7.0) return 'bg-[#4caf50] text-white';
    if (score >= 5.0) return 'bg-[#ff9800] text-white';
    return 'bg-[#f44336] text-white';
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-[#e0e0e0] px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>PITCHFORK</h1>
          <BookOpen className="w-5 h-5 text-[#999]" />
        </div>
        <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[#999]" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..." className="bg-transparent text-sm outline-none flex-1 placeholder-[#999]"
          />
          {searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-[#999]" /></button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e0e0e0]">
        {(['latest', 'best', 'yours'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-semibold capitalize ${tab === t ? 'border-b-2 border-black text-black' : 'text-[#999]'}`}>
            {t === 'best' ? 'Best New Music' : t === 'yours' ? 'Your Reviews' : 'Latest'}
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="divide-y divide-[#eee]">
        {filtered.length > 0 ? filtered.map(review => (
          <div key={review.id} className="p-4">
            <div className="flex gap-3">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-lg font-black flex-shrink-0 ${getScoreColor(review.score)}`}>
                {review.score.toFixed(1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  {review.score >= 8.0 && <Star className="w-3.5 h-3.5 text-[#ff6b00] fill-[#ff6b00]" />}
                  {review.score >= 8.0 && <span className="text-[10px] font-bold text-[#ff6b00] uppercase">Best New Music</span>}
                </div>
                <h3 className="font-bold text-sm leading-tight">{review.song_title || review.album_title || 'Untitled'}</h3>
                <p className="text-xs text-[#666] mt-0.5">{review.artist_name}</p>
                <p className="text-xs text-[#333] mt-2 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                  {review.review_text}
                </p>
                <p className="text-[10px] text-[#999] mt-2">By {review.reviewer_name} · Turn {review.turn_number}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="p-8 text-center text-[#999] text-sm">
            {tab === 'yours' ? 'No reviews of your music yet. Release more songs to get reviewed!' : 'No reviews yet. They appear after each turn.'}
          </div>
        )}
      </div>
    </div>
  );
}
