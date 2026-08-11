import type { Profile } from '@/hooks/useProfile';

const KEY = 'stardom_local_profile';

/** Offline-first save: used when the hosted database can't be reached. */
export function getLocalProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable */
  }
}

export function clearLocalProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export function createLocalProfile(input: {
  artistName: string;
  avatarUrl: string | null;
  money: number;
  genre: string;
  age: number;
}): Profile {
  const now = new Date().toISOString();
  const profile: Profile = {
    id: crypto.randomUUID(),
    user_id: `local-${crypto.randomUUID()}`,
    artist_name: input.artistName,
    avatar_url: input.avatarUrl,
    bio: '',
    starting_money: input.money,
    current_money: input.money,
    total_streams: 0,
    monthly_listeners: 0,
    spotify_followers: 0,
    apple_music_listeners: 0,
    youtube_subscribers: 0,
    x_followers: 0,
    created_at: now,
    updated_at: now,
    genre: input.genre,
    age: input.age,
    has_home_studio: false,
    home_studio_level: 0,
    vault_songs: [],
  };
  saveLocalProfile(profile);
  return profile;
}
