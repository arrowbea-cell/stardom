import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Film, DollarSign, Eye, TrendingUp, Music, Clapperboard, Video, Sparkles } from 'lucide-react';
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
  { id: 'low', name: 'Lyric Video', cost: 500, boost: 1000, icon: Film, desc: 'Animated text over visuals', viewMultiplier: 1 },
  { id: 'medium', name: 'Standard MV', cost: 5000, boost: 10000, icon: Clapperboard, desc: 'Professional music video', viewMultiplier: 3 },
  { id: 'high', name: 'Cinematic MV', cost: 20000, boost: 50000, icon: Video, desc: 'High-budget production', viewMultiplier: 8 },
  { id: 'blockbuster', name: 'Blockbuster MV', cost: 100000, boost: 250000, icon: Sparkles, desc: 'A-list directors, VFX, exotic locations', viewMultiplier: 20 },
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
      toast.error("Not enough money");
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

    toast.success(`Music video produced! ${formatNumber(initialViews)} initial views`);
    setProducing(false);
    setSelectedSong(null);

    const { data: newVideos } = await supabase.from('music_videos').select('*, songs!music_videos_song_id_fkey(title)')
      .eq('artist_id', profile.id).order('created_at', { ascending: false });
    if (newVideos) setVideos(newVideos.map((v: any) => ({ ...v, song_title: v.songs?.title })));
  };

  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

  return (
    <div className="min-h-full bg-[#050505] text-[#eee]">
      <div className="bg-gradient-to-b from-[#111] to-[#050505] px-4 pt-4 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg border border-[#333] flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-[#888]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Music Videos</h1>
            <p className="text-[10px] text-[#666] font-mono">{videos.length} videos · {formatNumber(totalViews)} views</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a] mx-4">
        <button onClick={() => setTab('create')} className={`flex-1 py-2.5 text-[10px] font-medium uppercase tracking-wider ${tab === 'create' ? 'text-[#eee] border-b border-[#eee]' : 'text-[#555]'}`}>
          Create
        </button>
        <button onClick={() => setTab('library')} className={`flex-1 py-2.5 text-[10px] font-medium uppercase tracking-wider ${tab === 'library' ? 'text-[#eee] border-b border-[#eee]' : 'text-[#555]'}`}>
          Library ({videos.length})
        </button>
      </div>

      {tab === 'create' && (
        <div className="px-4 py-4 space-y-4">
          <div>
            <h3 className="text-[10px] font-medium text-[#666] mb-2 uppercase tracking-wider">Select Song</h3>
            {songs.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {songs.map((song) => (
                  <button key={song.id} onClick={() => setSelectedSong(song.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left border ${
                      selectedSong === song.id ? 'border-[#555] bg-[#111]' : 'border-transparent bg-[#0a0a0a]'
                    }`}>
                    <div className="w-8 h-8 rounded bg-[#1a1a1a] overflow-hidden flex-shrink-0">
                      {song.cover_url ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-3 h-3 text-[#444] m-2.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{song.title}</p>
                      <p className="text-[10px] text-[#555] font-mono">{formatNumber(song.streams)} streams</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#555] bg-[#0a0a0a] rounded-lg p-3">Release a song first</p>
            )}
          </div>

          <div>
            <h3 className="text-[10px] font-medium text-[#666] mb-2 uppercase tracking-wider">Budget</h3>
            <div className="space-y-1.5">
              {BUDGET_TIERS.map((tier) => {
                const TierIcon = tier.icon;
                return (
                  <button key={tier.id} onClick={() => setSelectedBudget(tier.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border ${
                      selectedBudget === tier.id ? 'border-[#555] bg-[#111]' : 'border-transparent bg-[#0a0a0a]'
                    }`}>
                    <TierIcon className="w-4 h-4 text-[#666]" strokeWidth={1.5} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">{tier.name}</p>
                        <p className="text-xs font-mono text-[#888]">{formatMoney(tier.cost)}</p>
                      </div>
                      <p className="text-[10px] text-[#555] mt-0.5">{tier.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleProduce} disabled={producing || !selectedSong}
            className="w-full border border-[#444] rounded-lg py-3 font-medium text-sm disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-[#111] transition-colors">
            {producing ? (
              <><div className="w-3.5 h-3.5 border border-[#eee] border-t-transparent rounded-full animate-spin" /> Producing...</>
            ) : (
              <><Film className="w-4 h-4" strokeWidth={1.5} /> Produce Video</>
            )}
          </button>
        </div>
      )}

      {tab === 'library' && (
        <div className="px-4 py-4 space-y-2">
          {videos.length > 0 ? videos.map((video) => {
            const tier = BUDGET_TIERS.find(t => t.id === video.budget);
            const TierIcon = tier?.icon || Film;
            return (
              <div key={video.id} className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <TierIcon className="w-4 h-4 text-[#555]" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{video.song_title || 'Unknown'}</p>
                    <p className="text-[10px] text-[#555]">{tier?.name || video.budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] text-[#555] font-mono">
                  <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{formatNumber(video.views)}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" />+{formatNumber(video.youtube_boost)}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />{formatMoney(video.cost)}</span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-10 text-[#555]">
              <Video className="w-6 h-6 mx-auto mb-2 opacity-40" strokeWidth={1.5} />
              <p className="text-xs">No music videos yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
