import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Video, Film, DollarSign, Eye, TrendingUp, Music, Clapperboard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: Profile;
}

interface MusicVideo {
  id: string;
  song_id: string;
  budget: string;
  views: number;
  youtube_boost: number;
  cost: number;
  created_at: string;
  song_title?: string;
}

const BUDGET_TIERS = [
  { id: 'low', name: 'Lyric Video', cost: 500, boost: 1000, emoji: '📝', desc: 'Simple animated text over visuals', viewMultiplier: 1 },
  { id: 'medium', name: 'Standard MV', cost: 5000, boost: 10000, emoji: '🎬', desc: 'Professional music video with a concept', viewMultiplier: 3 },
  { id: 'high', name: 'Cinematic MV', cost: 20000, boost: 50000, emoji: '🎥', desc: 'High-budget cinematic production', viewMultiplier: 8 },
  { id: 'blockbuster', name: 'Blockbuster MV', cost: 100000, boost: 250000, emoji: '🏆', desc: 'A-list directors, exotic locations, VFX', viewMultiplier: 20 },
];

export default function MusicVideoApp({ profile }: Props) {
  const { user } = useAuth();
  const [songs, setSongs] = useState<any[]>([]);
  const [videos, setVideos] = useState<MusicVideo[]>([]);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState('medium');
  const [producing, setProducing] = useState(false);
  const [tab, setTab] = useState<'create' | 'library'>('create');

  useEffect(() => {
    supabase.from('songs').select('*').eq('artist_id', profile.id).gt('streams', 0).order('streams', { ascending: false })
      .then(({ data }) => { if (data) setSongs(data); });

    supabase.from('music_videos').select('*, songs!music_videos_song_id_fkey(title)')
      .eq('artist_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setVideos(data.map((v: any) => ({ ...v, song_title: v.songs?.title })));
      });
  }, [profile.id]);

  const handleProduce = async () => {
    if (!user || !selectedSong) return;
    const tier = BUDGET_TIERS.find(t => t.id === selectedBudget)!;

    if (profile.current_money < tier.cost) {
      toast.error("You can't afford this production!");
      return;
    }

    setProducing(true);
    await new Promise(r => setTimeout(r, 2500));

    const initialViews = Math.floor((Math.random() * 5000 + 1000) * tier.viewMultiplier);

    const { error } = await supabase.from('music_videos').insert({
      artist_id: profile.id,
      song_id: selectedSong,
      budget: tier.id,
      views: initialViews,
      youtube_boost: tier.boost,
      cost: tier.cost,
    });

    if (error) { toast.error(error.message); setProducing(false); return; }

    await supabase.from('profiles').update({
      current_money: profile.current_money - tier.cost,
      youtube_subscribers: profile.youtube_subscribers + Math.floor(tier.boost * 0.1),
      total_streams: profile.total_streams + Math.floor(initialViews * 0.5),
    }).eq('id', profile.id);

    toast.success(`Music video produced! 🎬 ${formatNumber(initialViews)} initial views!`);
    setProducing(false);
    setSelectedSong(null);

    const { data: newVideos } = await supabase.from('music_videos').select('*, songs!music_videos_song_id_fkey(title)')
      .eq('artist_id', profile.id).order('created_at', { ascending: false });
    if (newVideos) setVideos(newVideos.map((v: any) => ({ ...v, song_title: v.songs?.title })));
  };

  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

  return (
    <div className="min-h-full bg-[#0a0a0a] text-white">
      <div className="bg-gradient-to-b from-[#dc2626]/30 to-[#0a0a0a] px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#dc2626] flex items-center justify-center">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Music Videos</h1>
            <p className="text-xs text-white/60">{videos.length} videos • {formatNumber(totalViews)} total views</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#222] mx-4">
        <button onClick={() => setTab('create')} className={`flex-1 py-3 text-sm font-medium ${tab === 'create' ? 'text-white border-b-2 border-[#dc2626]' : 'text-[#888]'}`}>
          Create
        </button>
        <button onClick={() => setTab('library')} className={`flex-1 py-3 text-sm font-medium ${tab === 'library' ? 'text-white border-b-2 border-[#dc2626]' : 'text-[#888]'}`}>
          Library ({videos.length})
        </button>
      </div>

      {tab === 'create' && (
        <div className="px-4 py-4 space-y-5">
          {/* Select song */}
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Select a Released Song</h3>
            {songs.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSong(song.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                      selectedSong === song.id ? 'bg-[#dc2626]/20 ring-1 ring-[#dc2626]' : 'bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#282828] overflow-hidden flex-shrink-0">
                      {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-[#555] m-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-[#888]">{formatNumber(song.streams)} streams</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888] bg-[#1a1a1a] rounded-xl p-4">Release a song first to create a music video!</p>
            )}
          </div>

          {/* Budget tiers */}
          <div>
            <h3 className="text-sm font-bold text-[#888] mb-2">Production Budget</h3>
            <div className="space-y-2">
              {BUDGET_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedBudget(tier.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left ${
                    selectedBudget === tier.id ? 'bg-[#dc2626]/20 ring-1 ring-[#dc2626]' : 'bg-[#1a1a1a]'
                  }`}
                >
                  <span className="text-2xl">{tier.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{tier.name}</p>
                      <p className="text-sm font-bold text-[#dc2626]">{formatMoney(tier.cost)}</p>
                    </div>
                    <p className="text-xs text-[#888] mt-0.5">{tier.desc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dc2626]/10 text-[#dc2626]">+{formatNumber(tier.boost)} YT boost</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleProduce}
            disabled={producing || !selectedSong}
            className="w-full bg-gradient-to-r from-[#dc2626] to-[#ef4444] rounded-xl py-4 font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {producing ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Producing...</>
            ) : (
              <><Film className="w-5 h-5" /> Produce Music Video</>
            )}
          </button>
        </div>
      )}

      {tab === 'library' && (
        <div className="px-4 py-4 space-y-3">
          {videos.length > 0 ? videos.map((video) => {
            const tier = BUDGET_TIERS.find(t => t.id === video.budget);
            return (
              <div key={video.id} className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 rounded-lg bg-[#282828] flex items-center justify-center text-xl">
                    {tier?.emoji || '🎬'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{video.song_title || 'Unknown'}</p>
                    <p className="text-xs text-[#888]">{tier?.name || video.budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1 text-[#888]">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(video.views)} views</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#888]">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{formatNumber(video.youtube_boost)} YT boost</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#888]">
                    <DollarSign className="w-3 h-3" />
                    <span>{formatMoney(video.cost)} spent</span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-12 text-[#888]">
              <Video className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No music videos yet</p>
              <p className="text-xs mt-1">Create your first music video to boost your YouTube!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
