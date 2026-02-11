import { supabase } from "@/integrations/supabase/client";

export async function uploadArtistImage(file: File, userId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('artist-images')
    .upload(fileName, file);
  
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  
  const { data } = supabase.storage
    .from('artist-images')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

export async function getGameState() {
  const { data, error } = await supabase
    .from('game_state')
    .select('*')
    .limit(1)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getTimeUntilNextTurn(turnStartedAt: string, durationMinutes: number): Promise<number> {
  const started = new Date(turnStartedAt).getTime();
  const duration = durationMinutes * 60 * 1000;
  const nextTurn = started + duration;
  return Math.max(0, nextTurn - Date.now());
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

export function formatMoney(num: number): string {
  return '$' + num.toLocaleString();
}
