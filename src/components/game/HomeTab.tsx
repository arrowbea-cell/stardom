import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useGameState } from '@/hooks/useGameState';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { TrendingUp, Music, DollarSign, Headphones, Users, Zap, Trophy, Radio, Star, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  profile: Profile;
}

interface StreamEvent {
  id: string;
  platform: string;
  streams_gained: number;
  turn_number: number;
  song_title?: string;
}

const ACHIEVEMENTS = [
  { id: 'first_song', label: 'First Release', desc: 'Release your first song', icon: Music, threshold: (p: Profile) => true, check: 'songs' },
  { id: '10k_streams', label: '10K Club', desc: 'Reach 10,000 total streams', icon: Headphones, threshold: (p: Profile) => p.total_streams >= 10000 },
  { id: '100k_streams', label: 'Rising Star', desc: 'Reach 100,000 total streams', icon: Star, threshold: (p: Profile) => p.total_streams >= 100000 },
  { id: '1m_streams', label: 'Superstar', desc: 'Reach 1,000,000 total streams', icon: Trophy, threshold: (p: Profile) => p.total_streams >= 1000000 },
  { id: '1k_listeners', label: 'Buzzing', desc: '1,000 monthly listeners', icon: Users, threshold: (p: Profile) => p.monthly_listeners >= 1000 },
  { id: '10k_listeners', label: 'Fan Favorite', desc: '10,000 monthly listeners', icon: Users, threshold: (p: Profile) => p.monthly_listeners >= 10000 },
  { id: 'radio_play', label: 'On Air', desc: 'Get your first radio spins', icon: Radio, threshold: () => true, check: 'radio' },
  { id: 'rich', label: 'Cash Money', desc: 'Have $50,000+', icon: DollarSign, threshold: (p: Profile) => p.current_money >= 50000 },
];

const PLATFORM_COLORS: Record<string, string> = {
  spotify: 'text-primary',
  apple_music: 'text-[hsl(var(--apple-red))]',
  youtube: 'text-[hsl(var(--youtube-red))]',
};

const PLATFORM_NAMES: Record<string, string> = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube: 'YouTube',
};

export default function HomeTab({ profile }: Props) {
  const { gameState, formatTimeLeft, timeLeft } = useGameState();
  const [recentActivity, setRecentActivity] = useState<StreamEvent[]>([]);
  const [songCount, setSongCount] = useState(0);
  const [totalRadioSpins, setTotalRadioSpins] = useState(0);

  useEffect(() => {
    // Fetch recent stream activity
    supabase
      .from('stream_history')
      .select('id, platform, streams_gained, turn_number, songs!stream_history_song_id_fkey(title)')
      .eq('artist_id', profile.id)
      .order('turn_number', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setRecentActivity(data.map((d: any) => ({
            ...d,
            song_title: d.songs?.title || 'Unknown',
          })));
        }
      });

    // Fetch song count for achievements
    supabase
      .from('songs')
      .select('id, radio_spins')
      .eq('artist_id', profile.id)
      .then(({ data }) => {
        if (data) {
          setSongCount(data.length);
          setTotalRadioSpins(data.reduce((sum, s) => sum + (s.radio_spins || 0), 0));
        }
      });
  }, [profile.id]);

  const estimatedRevenue = Math.floor(profile.total_streams * 0.004);

  const stats = [
    { label: 'Total Streams', value: formatNumber(profile.total_streams), icon: Headphones, color: 'text-primary' },
    { label: 'Monthly Listeners', value: formatNumber(profile.monthly_listeners), icon: Users, color: 'text-primary' },
    { label: 'Balance', value: formatMoney(profile.current_money), icon: DollarSign, color: 'text-primary' },
    { label: 'Est. Revenue', value: formatMoney(estimatedRevenue), icon: TrendingUp, color: 'text-primary' },
  ];

  const unlockedAchievements = ACHIEVEMENTS.filter(a => {
    if (a.check === 'songs') return songCount > 0;
    if (a.check === 'radio') return totalRadioSpins > 0;
    return a.threshold(profile);
  });

  const nextAchievement = ACHIEVEMENTS.find(a => {
    if (a.check === 'songs') return songCount === 0;
    if (a.check === 'radio') return totalRadioSpins === 0;
    return !a.threshold(profile);
  });

  return (
    <div className="p-4 space-y-5">
      {/* Welcome + Timer */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-bold">Welcome back, {profile.artist_name}</h2>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono">
            <Clock className="w-3 h-3" />
            {formatTimeLeft()}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Turn {gameState?.current_turn ?? 0} • Next update {timeLeft === 0 ? 'processing...' : 'coming soon'}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="font-display text-xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Achievements</h3>
          <span className="ml-auto text-xs text-muted-foreground">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievements.includes(a);
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  unlocked 
                    ? 'bg-primary/15 text-primary border border-primary/30' 
                    : 'bg-secondary/50 text-muted-foreground/40 border border-border/30'
                }`}
                title={a.desc}
              >
                <Icon className="w-3 h-3" />
                {a.label}
              </div>
            );
          })}
        </div>
        {nextAchievement && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
            <Zap className="w-3 h-3 text-primary" />
            <span>Next: <span className="text-foreground font-medium">{nextAchievement.label}</span> — {nextAchievement.desc}</span>
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpRight className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Recent Activity</h3>
        </div>
        {recentActivity.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentActivity.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    event.platform === 'spotify' ? 'bg-primary' :
                    event.platform === 'apple_music' ? 'bg-[hsl(var(--apple-red))]' :
                    'bg-[hsl(var(--youtube-red))]'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    <span className={PLATFORM_COLORS[event.platform]}>{PLATFORM_NAMES[event.platform]}</span>
                    {' · '}{event.song_title}
                  </span>
                </div>
                <span className="text-xs font-mono text-primary">+{formatNumber(event.streams_gained)}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">No activity yet — release a song to get started!</p>
        )}
      </div>

      {/* Quick Tips */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Tips</h3>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2"><span className="text-primary">•</span> Release songs from the Studio app to earn streams</li>
          <li className="flex items-center gap-2"><span className="text-primary">•</span> Promote songs for a boost multiplier on the next turn</li>
          <li className="flex items-center gap-2"><span className="text-primary">•</span> Charts refresh every hour — climb the Hot 100!</li>
          <li className="flex items-center gap-2"><span className="text-primary">•</span> Check your presence across Spotify, Apple Music & more</li>
        </ul>
      </div>
    </div>
  );
}
