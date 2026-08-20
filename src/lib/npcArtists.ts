/** Real-world inspired NPC artists that populate the charts alongside the player. */

export interface NpcArtist {
  name: string;
  genre: string;
  /** 1-10, drives baseline streaming power */
  power: number;
  songs: string[];
}

export const NPC_ARTISTS: NpcArtist[] = [
  { name: 'Drake', genre: 'Hip-Hop', power: 10, songs: ['Nokia Nights', 'Certified', 'Toronto Rain', 'No Face'] },
  { name: 'Taylor Swift', genre: 'Pop', power: 10, songs: ['Paper Rings II', 'Midnight Drive', 'Cardigan Weather'] },
  { name: 'Kendrick Lamar', genre: 'Hip-Hop', power: 10, songs: ['Compton Gold', 'Mirror Talk', 'Crown Heavy'] },
  { name: 'Bad Bunny', genre: 'Latin', power: 10, songs: ['Verano Frio', 'Ojos Rojos', 'Isla Bonita'] },
  { name: 'The Weeknd', genre: 'R&B', power: 9, songs: ['After Dark', 'Neon Blood', 'Faithless'] },
  { name: 'Beyonce', genre: 'R&B', power: 9, songs: ['Renaissance II', 'Texas Dust', 'Halo Line'] },
  { name: 'SZA', genre: 'R&B', power: 9, songs: ['Saturn Rings', 'Kill Bill II', 'Low Tide'] },
  { name: 'Travis Scott', genre: 'Hip-Hop', power: 9, songs: ['Utopia Gate', 'Astro Lights', 'Sicko Nights'] },
  { name: 'Billie Eilish', genre: 'Pop', power: 9, songs: ['Blue Room', 'Hit Me Twice', 'Lunch Break'] },
  { name: 'Ariana Grande', genre: 'Pop', power: 9, songs: ['Eternal Sunshine', 'Yes And Then', 'Positions II'] },
  { name: 'Post Malone', genre: 'Pop', power: 8, songs: ['Cowboy Blues', 'Circles II', 'Sunflower Fields'] },
  { name: 'Doja Cat', genre: 'Pop', power: 8, songs: ['Paint The Town', 'Agora Nights', 'Demons'] },
  { name: 'Future', genre: 'Hip-Hop', power: 8, songs: ['Pluto Return', 'Wait For U II', 'Mask Off Again'] },
  { name: 'J. Cole', genre: 'Hip-Hop', power: 8, songs: ['Dreamville Nights', 'No Role Models', 'Fayetteville'] },
  { name: 'Karol G', genre: 'Latin', power: 8, songs: ['Manana Sera', 'Provenza II', 'Bichota Reign'] },
  { name: 'Peso Pluma', genre: 'Latin', power: 8, songs: ['Ella Baila', 'Rosa Pastel', 'Lady Gaga'] },
  { name: 'Olivia Rodrigo', genre: 'Pop', power: 8, songs: ['Guts II', 'Vampire Teeth', 'Drivers Test'] },
  { name: 'Dua Lipa', genre: 'Pop', power: 8, songs: ['Radical Optimism', 'Houdini Act', 'Levitating II'] },
  { name: 'Metro Boomin', genre: 'Hip-Hop', power: 8, songs: ['Heroes & Villains', 'Trance', 'Creepin II'] },
  { name: '21 Savage', genre: 'Hip-Hop', power: 7, songs: ['Redrum', 'Knife Talk II', 'A Lot More'] },
  { name: 'Frank Ocean', genre: 'R&B', power: 7, songs: ['Blonde II', 'Pink Matter', 'Nights Out'] },
  { name: 'Tyler, The Creator', genre: 'Hip-Hop', power: 7, songs: ['Chromakopia', 'Igor Returns', 'Sorry Not Sorry'] },
  { name: 'Lana Del Rey', genre: 'Pop', power: 7, songs: ['Ocean Blvd', 'Blue Jeans II', 'Chemtrails'] },
  { name: 'Arctic Monkeys', genre: 'Rock', power: 7, songs: ['505 Reprise', 'Body Paint', 'Car Radio'] },
  { name: 'Imagine Dragons', genre: 'Rock', power: 7, songs: ['Mercury Rising', 'Bones II', 'Enemy Lines'] },
  { name: 'Coldplay', genre: 'Rock', power: 7, songs: ['Moon Music', 'Yellow Again', 'Sky Full'] },
  { name: 'Foo Fighters', genre: 'Rock', power: 6, songs: ['Rescued', 'Everlong II', 'Under You'] },
  { name: 'Paramore', genre: 'Rock', power: 6, songs: ['This Is Why', 'Running Out', 'Hard Times II'] },
  { name: 'Rauw Alejandro', genre: 'Latin', power: 7, songs: ['Playa Saturno', 'Todo De Ti II', 'Cosa Guapa'] },
  { name: 'Feid', genre: 'Latin', power: 7, songs: ['Ferxxo 100', 'Luna Verde', 'Classy 101'] },
  { name: 'Bruno Mars', genre: 'R&B', power: 8, songs: ['Die With A Smile', 'Leave The Door II', 'Silk Nights'] },
  { name: 'Chris Brown', genre: 'R&B', power: 7, songs: ['Under The Influence', 'Residuals', 'Sensational'] },
  { name: 'Summer Walker', genre: 'R&B', power: 6, songs: ['Still Over It', 'No Love II', 'Session 33'] },
  { name: 'Central Cee', genre: 'Hip-Hop', power: 7, songs: ['Sprinter II', 'Doja Remix', 'Band4Band'] },
  { name: 'Ice Spice', genre: 'Hip-Hop', power: 6, songs: ['Deli', 'Munch II', 'Think U The Sh*t'] },
  { name: 'Sabrina Carpenter', genre: 'Pop', power: 8, songs: ['Espresso II', 'Please Please', 'Taste Test'] },
  { name: 'Chappell Roan', genre: 'Pop', power: 7, songs: ['Pink Pony', 'Hot To Go II', 'Red Wine Supernova'] },
  { name: 'Tame Impala', genre: 'Rock', power: 6, songs: ['Borderline II', 'The Less I Know', 'Lost In Yesterday'] },
  { name: 'Burna Boy', genre: 'Global', power: 7, songs: ['City Boys', 'Last Last II', 'Higher Ground'] },
  { name: 'Rema', genre: 'Global', power: 7, songs: ['Calm Down II', 'Charm', 'Ozeba'] },
  { name: 'Stray Kids', genre: 'Global', power: 7, songs: ['Lalalala', 'Chk Chk Boom', 'Maniac II'] },
  { name: 'NewJeans', genre: 'Global', power: 7, songs: ['Super Shy II', 'Ditto Nights', 'How Sweet'] },
];

/** Deterministic random-ish cover artwork for a song. */
export function coverFor(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/200/200`;
}
