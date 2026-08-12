import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, CloudUpload } from 'lucide-react';
import { toast } from 'sonner';

interface Entry {
  id: string;
  user_id: string;
  artist_name: string;
  avatar_url: string | null;
  genre: string | null;
  total_streams: number;
  monthly_listeners: number;
  current_money: number;
  updated_at: string;
}

export default function LeaderboardTab({ profile }: { profile: Profile }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('leaderboard')
      .select('*')
      .order('total_streams', { ascending: false })
      .limit(100);
    setEntries((data as unknown as Entry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`leaderboard-live-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const sync = async () => {
    setSyncing(true);
    const { error } = await (supabase as any).from('leaderboard').upsert(
      {
        user_id: profile.user_id,
        artist_name: profile.artist_name,
        avatar_url: profile.avatar_url,
        genre: profile.genre ?? null,
        total_streams: profile.total_streams,
        monthly_listeners: profile.monthly_listeners,
        current_money: profile.current_money,
      },
      { onConflict: 'user_id' }
    );
    if (error) toast.error(error.message);
    else {
      toast.success('Save synced to the live leaderboard');
      load();
    }
    setSyncing(false);
  };

  const myRank = entries.findIndex(e => e.user_id === profile.user_id) + 1;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 hollow-icon" strokeWidth={1.5} />
          <h2 className="font-display font-semibold text-sm tracking-tight">Live Leaderboard</h2>
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
        </button>
      </div>

      <div className="glass-card p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Your rank</p>
          <p className="font-display font-bold text-lg">{myRank > 0 ? `#${myRank}` : 'Unranked'}</p>
        </div>
        <Button onClick={sync} disabled={syncing} className="bg-primary text-primary-foreground font-semibold">
          <CloudUpload className="w-4 h-4 mr-1.5" />
          {syncing ? 'Syncing…' : 'Sync my save'}
        </Button>
      </div>

      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div
            key={e.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              e.user_id === profile.user_id ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-secondary/50'
            }`}
          >
            <span className="mono text-xs w-6 text-muted-foreground">{i + 1}</span>
            {e.avatar_url ? (
              <img src={e.avatar_url} alt={e.artist_name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                {e.artist_name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{e.artist_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {e.genre ?? '—'} · {formatNumber(e.monthly_listeners)} listeners
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs mono">{formatNumber(e.total_streams)}</p>
              <p className="text-[10px] text-muted-foreground mono">{formatMoney(e.current_money)}</p>
            </div>
          </div>
        ))}
        {!loading && entries.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            No one has synced yet — be the first.
          </p>
        )}
      </div>
    </div>
  );
}
