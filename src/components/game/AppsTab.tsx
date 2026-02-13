import { useState } from 'react';
import { Profile } from '@/hooks/useProfile';
import spotifyLogo from '@/assets/spotify-logo.png';
import appleMusicLogo from '@/assets/apple-music-logo.png';
import youtubeLogo from '@/assets/youtube-logo.png';
import xLogo from '@/assets/x-logo.png';
import SpotifyApp from '@/components/apps/SpotifyApp';
import AppleMusicApp from '@/components/apps/AppleMusicApp';
import YouTubeApp from '@/components/apps/YouTubeApp';
import YouTubeMusicApp from '@/components/apps/YouTubeMusicApp';
import XApp from '@/components/apps/XApp';
import StudioApp from '@/components/apps/StudioApp';
import AdminApp from '@/components/apps/AdminApp';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic2, Shield, Music } from 'lucide-react';

interface Props {
  profile: Profile;
}

type AppType = 'spotify' | 'apple-music' | 'youtube' | 'youtube-music' | 'x' | 'studio' | 'admin' | null;

const apps = [
  { id: 'spotify' as const, name: 'Spotify', logo: spotifyLogo, bgClass: 'bg-[#121212]' },
  { id: 'apple-music' as const, name: 'Apple Music', logo: appleMusicLogo, bgClass: 'bg-gradient-to-br from-[#fc3c44] to-[#8b5cf6]' },
  { id: 'youtube' as const, name: 'YouTube', logo: youtubeLogo, bgClass: 'bg-[#0f0f0f]' },
  { id: 'youtube-music' as const, name: 'YT Music', logo: null, bgClass: 'bg-gradient-to-br from-[#ff0000] to-[#cc0000]' },
  { id: 'x' as const, name: 'X', logo: xLogo, bgClass: 'bg-[#000000]' },
  { id: 'studio' as const, name: 'Studio', logo: null, bgClass: 'bg-gradient-to-br from-[#1db954] to-[#148a3c]' },
  { id: 'admin' as const, name: 'Admin', logo: null, bgClass: 'bg-gradient-to-br from-[#ef4444] to-[#f97316]' },
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
          {openApp === 'youtube-music' && <YouTubeMusicApp profile={profile} />}
          {openApp === 'x' && <XApp profile={profile} />}
          {openApp === 'studio' && <StudioApp profile={profile} />}
          {openApp === 'admin' && <AdminApp profile={profile} />}
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
            <div className={`app-icon overflow-hidden flex items-center justify-center ${['studio', 'admin', 'youtube-music'].includes(app.id) ? app.bgClass : 'bg-secondary'}`}>
              {app.logo ? (
                <img src={app.logo} alt={app.name} className="w-full h-full object-contain p-2" />
              ) : app.id === 'admin' ? (
                <Shield className="w-8 h-8 text-white" />
              ) : app.id === 'youtube-music' ? (
                <Music className="w-8 h-8 text-white" />
              ) : (
                <Mic2 className="w-8 h-8 text-white" />
              )}
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
