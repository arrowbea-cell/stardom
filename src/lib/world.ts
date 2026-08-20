import { NPC_ARTISTS, coverFor } from './npcArtists';

/**
 * Local, turn-based world simulation. The player advances time manually with
 * the "Next Week" button instead of waiting on a server clock.
 */

const KEY = 'stardom_world_v1';
export const WORLD_EVENT = 'stardom:world-changed';

export interface NpcSong {
  id: string;
  title: string;
  artist_name: string;
  genre: string;
  cover_url: string;
  streams: number;
  weekly_streams: number;
  radio_spins: number;
  last_position: number | null;
  position: number | null;
}

export interface NpcArtistState {
  id: string;
  artist_name: string;
  genre: string;
  avatar_url: string;
  monthly_listeners: number;
  total_streams: number;
}

export interface World {
  week: number;
  songs: NpcSong[];
  artists: NpcArtistState[];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createWorld(): World {
  const songs: NpcSong[] = [];
  const artists: NpcArtistState[] = NPC_ARTISTS.map((a) => {
    const base = a.power * a.power * rand(9000, 16000);
    a.songs.forEach((title, i) => {
      songs.push({
        id: `npc-${a.name}-${i}`.replace(/\s+/g, '-').toLowerCase(),
        title,
        artist_name: a.name,
        genre: a.genre,
        cover_url: coverFor(`${a.name}-${title}`),
        streams: Math.floor(base * rand(6, 40) / 10),
        weekly_streams: 0,
        radio_spins: rand(200, 6000),
        last_position: null,
        position: null,
      });
    });
    return {
      id: `npc-artist-${a.name}`.replace(/\s+/g, '-').toLowerCase(),
      artist_name: a.name,
      genre: a.genre,
      avatar_url: coverFor(`artist-${a.name}`),
      monthly_listeners: base * rand(3, 9),
      total_streams: base * rand(30, 120),
    };
  });

  const world: World = { week: 1, songs, artists };
  rankSongs(world);
  return world;
}

function rankSongs(world: World) {
  const sorted = [...world.songs].sort((a, b) => b.streams - a.streams);
  sorted.forEach((s, i) => {
    s.last_position = s.position;
    s.position = i + 1;
  });
}

export function getWorld(): World {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as World;
  } catch {
    /* ignore */
  }
  const world = createWorld();
  saveWorld(world);
  return world;
}

export function saveWorld(world: World) {
  try {
    localStorage.setItem(KEY, JSON.stringify(world));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(WORLD_EVENT));
}

export interface WeekResult {
  week: number;
  streamsGained: number;
  listenersGained: number;
  moneyEarned: number;
}

/** Advance the world one week and return what the player earned. */
export function advanceWeek(player: {
  total_streams: number;
  monthly_listeners: number;
}): { world: World; result: WeekResult } {
  const world = getWorld();
  world.week += 1;

  for (const song of world.songs) {
    const artist = NPC_ARTISTS.find((a) => a.name === song.artist_name);
    const power = artist?.power ?? 5;
    const gained = Math.floor(power * power * rand(4000, 22000) / 10);
    song.weekly_streams = gained;
    song.streams += gained;
    song.radio_spins += rand(0, power * 220);
  }
  rankSongs(world);

  for (const a of world.artists) {
    const weekly = world.songs
      .filter((s) => s.artist_name === a.artist_name)
      .reduce((sum, s) => sum + s.weekly_streams, 0);
    a.total_streams += weekly;
    a.monthly_listeners = Math.floor(a.monthly_listeners * (0.94 + Math.random() * 0.14) + weekly * 0.12);
  }

  saveWorld(world);

  const base = Math.max(250, Math.floor(player.monthly_listeners * (1.2 + Math.random() * 1.6)));
  const streamsGained = base + rand(0, Math.floor(base * 0.5));
  const listenersGained = Math.floor(streamsGained * (0.15 + Math.random() * 0.2));
  const moneyEarned = Math.floor(streamsGained * 0.004);

  return {
    world,
    result: { week: world.week, streamsGained, listenersGained, moneyEarned },
  };
}

export function resetWorld() {
  localStorage.removeItem(KEY);
  saveWorld(createWorld());
}
