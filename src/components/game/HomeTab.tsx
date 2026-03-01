import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { useGameState } from '@/hooks/useGameState';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { TrendingUp, Music, DollarSign, Headphones, Users, Zap, Trophy, Radio, Star, Clock, ArrowUpRight, Activity, Disc3 } from 'lucide-react';
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

const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'SPT',
  apple_music: 'APL',
  youtube: 'YT',
};

export default function HomeTab({ profile }: Props) {
  const { gameState, formatTimeLeft, timeLeft } = useGameState();
  const [recentActivity, setRecentActivity] = useState<StreamEvent[]>([]);
  const [songCount, setSongCount] = useState(0);
  const [totalRadioSpins, setTotalRadioSpins] = useState(0);

  useEffect(() => {
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
    { label: 'Streams', value: formatNumber(profile.total_streams), icon: Activity },
    { label: 'Listeners', value: formatNumber(profile.monthly_listeners), icon: Users },
    { label: 'Balance', value: formatMoney(profile.current_money), icon: DollarSign },
    { label: 'Revenue', value: formatMoney(estimatedRevenue), icon: TrendingUp },
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

  const timerPercent = gameState ? Math.max(0, 100 - (timeLeft / (gameState.turn_duration_minutes * 60 * 1000)) * 100) : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Timer + Turn */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">{profile.artist_name}</h2>
            <p className="text-[11px] text-muted-foreground mono">Turn {gameState?.current_turn ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-display font-bold mono">{formatTimeLeft()}</p>
            <p className="text-[10px] text-muted-foreground">until next turn</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-[2px] bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground"
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Stats grid — minimal B&W */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <stat.icon className="w-3 h-3 text-muted-foreground hollow-icon" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="font-display text-lg font-bold mono">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Achievements — minimal */}
      <div className="glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-muted-foreground hollow-icon" strokeWidth={1.5} />
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider">Achievements</h3>
          </div>
          <span className="text-[10px] text-muted-foreground mono">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedAchievements.includes(a);
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all border ${
                  unlocked 
                    ? 'border-foreground/30 text-foreground bg-foreground/5' 
                    : 'border-border/30 text-muted-foreground/30'
                }`}
                title={a.desc}
              >
                <Icon className="w-2.5 h-2.5 hollow-icon" strokeWidth={1.5} />
                {a.label}
              </div>
            );
          })}
        </div>
        {nextAchievement && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/20">
            <Zap className="w-2.5 h-2.5 hollow-icon" strokeWidth={1.5} />
            <span>Next: <span className="text-foreground">{nextAchievement.label}</span> — {nextAchievement.desc}</span>
          </div>
        )}
      </div>

      {/* Recent Activity — clean feed */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground hollow-icon" strokeWidth={1.5} />
          <h3 className="font-display font-semibold text-xs uppercase tracking-wider">Activity</h3>
        </div>
        {recentActivity.length > 0 ? (
          <div className="space-y-0 max-h-48 overflow-y-auto">
            {recentActivity.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] mono text-muted-foreground w-6">{PLATFORM_LABELS[event.platform]}</span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">{event.song_title}</span>
                </div>
                <span className="text-[11px] mono text-foreground">+{formatNumber(event.streams_gained)}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground text-center py-6">No activity yet — release a song to get started</p>
        )}
      </div>

      {/* Quick Tips */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Disc3 className="w-3.5 h-3.5 text-muted-foreground hollow-icon" strokeWidth={1.5} />
          <h3 className="font-display font-semibold text-xs uppercase tracking-wider">Tips</h3>
        </div>
        <ul className="space-y-1 text-[11px] text-muted-foreground">
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-foreground/40" /> Release songs from the Studio app to earn streams</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-foreground/40" /> Promote songs for a boost multiplier next turn</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-foreground/40" /> Charts refresh every hour — climb the Hot 100</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-foreground/40" /> Buy visas to travel and perform worldwide</li>
        </ul>
      </div>
    </div>
  );
}
