import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

    // Calculate immediately
    const calcTime = () => {
      const started = new Date(gameState.turn_started_at).getTime();
      const duration = gameState.turn_duration_minutes * 60 * 1000;
      const nextTurn = started + duration;
      return Math.max(0, nextTurn - Date.now());
    };

    setTimeLeft(calcTime());
    
    const interval = setInterval(() => {
      const ms = calcTime();
      setTimeLeft(ms);
      
      // If turn is over, try to trigger processing
      if (ms === 0) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-turn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }).catch(() => {});
      }
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
