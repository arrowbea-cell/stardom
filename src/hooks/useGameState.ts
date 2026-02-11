import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTimeUntilNextTurn } from '@/lib/supabase-helpers';

export interface GameState {
  id: string;
  current_turn: number;
  turn_started_at: string;
  turn_duration_minutes: number;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('game_state')
        .select('*')
        .limit(1)
        .single();
      if (data) setGameState(data as GameState);
    };
    fetch();

    const channel = supabase
      .channel('game-state')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state',
      }, (payload) => {
        if (payload.new) setGameState(payload.new as GameState);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!gameState) return;
    
    const interval = setInterval(async () => {
      const ms = await getTimeUntilNextTurn(gameState.turn_started_at, gameState.turn_duration_minutes);
      setTimeLeft(ms);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  const formatTimeLeft = () => {
    const mins = Math.floor(timeLeft / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { gameState, timeLeft, formatTimeLeft };
}
