import { Profile } from '@/hooks/useProfile';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { TrendingUp, Music, DollarSign, Headphones, Users } from 'lucide-react';

interface Props {
  profile: Profile;
}

export default function HomeTab({ profile }: Props) {
  const stats = [
    { label: 'Total Streams', value: formatNumber(profile.total_streams), icon: Headphones, color: 'text-primary' },
    { label: 'Monthly Listeners', value: formatNumber(profile.monthly_listeners), icon: Users, color: 'text-primary' },
    { label: 'Balance', value: formatMoney(profile.current_money), icon: DollarSign, color: 'text-primary' },
    { label: 'Spotify Followers', value: formatNumber(profile.spotify_followers), icon: Music, color: 'text-spotify' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome */}
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-bold mb-1">Welcome back, {profile.artist_name}</h2>
        <p className="text-muted-foreground text-sm">Here's your career overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="font-display text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Career Tips</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Release songs to build your streaming numbers</li>
          <li>• Check the Charts tab to see where you rank</li>
          <li>• Open Apps to see your presence across platforms</li>
          <li>• Streams update every turn (1 hour)</li>
        </ul>
      </div>
    </div>
  );
}
