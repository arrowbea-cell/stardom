import { useState } from 'react';
import { Profile } from '@/hooks/useProfile';
import spotifyLogo from '@/assets/spotify-logo.png';
import appleMusicLogo from '@/assets/apple-music-logo.png';
import youtubeLogo from '@/assets/youtube-logo.png';
import xLogo from '@/assets/x-logo.png';
import SpotifyApp from '@/components/apps/SpotifyApp';
import AppleMusicApp from '@/components/apps/AppleMusicApp';
import YouTubeApp from '@/components/apps/YouTubeApp';
import XApp from '@/components/apps/XApp';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface Props {
  profile: Profile;
}

type AppType = 'spotify' | 'apple-music' | 'youtube' | 'x' | null;

const apps = [
  { id: 'spotify' as const, name: 'Spotify', logo: spotifyLogo, bgClass: 'bg-[#121212]' },
  { id: 'apple-music' as const, name: 'Apple Music', logo: appleMusicLogo, bgClass: 'bg-gradient-to-br from-[#fc3c44] to-[#8b5cf6]' },
  { id: 'youtube' as const, name: 'YouTube', logo: youtubeLogo, bgClass: 'bg-[#0f0f0f]' },
  { id: 'x' as const, name: 'X', logo: xLogo, bgClass: 'bg-[#000000]' },
];

export default function AppsTab({ profile }: Props) {
  const [openApp, setOpenApp] = useState<AppType>(null);

  if (openApp) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="min-h-full"
        >
          <button
            onClick={() => setOpenApp(null)}
            className="flex items-center gap-1 p-3 text-sm text-muted-foreground hover:text-foreground sticky top-0 z-50 bg-background/80 backdrop-blur-md w-full"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Apps
          </button>
          {openApp === 'spotify' && <SpotifyApp profile={profile} />}
          {openApp === 'apple-music' && <AppleMusicApp profile={profile} />}
          {openApp === 'youtube' && <YouTubeApp profile={profile} />}
          {openApp === 'x' && <XApp profile={profile} />}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="p-6">
      <h2 className="font-display text-xl font-bold mb-6">Your Apps</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => setOpenApp(app.id)}
            className="flex flex-col items-center gap-3 group"
          >
            <div className="app-icon overflow-hidden flex items-center justify-center bg-secondary">
              <img src={app.logo} alt={app.name} className="w-full h-full object-contain p-2" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {app.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
