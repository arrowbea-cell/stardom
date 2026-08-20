import { useCallback, useEffect, useState } from 'react';
import { advanceWeek, getWorld, WORLD_EVENT, type WeekResult, type World } from '@/lib/world';
import { getLocalProfile, saveLocalProfile } from '@/lib/localSave';

/** Player-controlled weekly turn system (no server clock). */
export function useWorld() {
  const [world, setWorld] = useState<World>(() => getWorld());
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    const onChange = () => setWorld(getWorld());
    window.addEventListener(WORLD_EVENT, onChange);
    return () => window.removeEventListener(WORLD_EVENT, onChange);
  }, []);

  const nextWeek = useCallback(async (): Promise<WeekResult | null> => {
    const profile = getLocalProfile();
    if (!profile) return null;
    setAdvancing(true);
    const { result } = advanceWeek(profile);
    saveLocalProfile({
      ...profile,
      total_streams: profile.total_streams + result.streamsGained,
      monthly_listeners: profile.monthly_listeners + result.listenersGained,
      current_money: profile.current_money + result.moneyEarned,
      spotify_followers: profile.spotify_followers + Math.floor(result.listenersGained * 0.4),
      updated_at: new Date().toISOString(),
    });
    setAdvancing(false);
    return result;
  }, []);

  return { world, week: world.week, nextWeek, advancing };
}
