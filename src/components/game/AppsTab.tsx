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
import CollabApp from '@/components/apps/CollabApp';
import BankApp from '@/components/apps/BankApp';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic2, Shield, Music, Handshake, Landmark } from 'lucide-react';

interface Props {
  profile: Profile;
}

type AppType = 'spotify' | 'apple-music' | 'youtube' | 'youtube-music' | 'x' | 'studio' | 'admin' | 'collab' | 'bank' | null;

const apps = [
  { id: 'spotify' as const, name: 'Spotify', logo: spotifyLogo, bgClass: 'bg-[#121212]' },
  { id: 'apple-music' as const, name: 'Apple Music', logo: appleMusicLogo, bgClass: 'bg-gradient-to-br from-[#fc3c44] to-[#8b5cf6]' },
  { id: 'youtube' as const, name: 'YouTube', logo: youtubeLogo, bgClass: 'bg-[#0f0f0f]' },
  { id: 'youtube-music' as const, name: 'YT Music', logo: null, bgClass: 'bg-gradient-to-br from-[#ff0000] to-[#cc0000]' },
  { id: 'x' as const, name: 'X', logo: xLogo, bgClass: 'bg-[#000000]' },
  { id: 'studio' as const, name: 'Studio', logo: null, bgClass: 'bg-gradient-to-br from-[#1db954] to-[#148a3c]' },
  { id: 'collab' as const, name: 'Collabs', logo: null, bgClass: 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]' },
  { id: 'bank' as const, name: 'Bank', logo: null, bgClass: 'bg-gradient-to-br from-[#0ea5e9] to-[#0369a1]' },
  { id: 'admin' as const, name: 'Admin', logo: null, bgClass: 'bg-gradient-to-br from-[#ef4444] to-[#f97316]' },
];

const APP_ICONS: Record<string, any> = {
  'youtube-music': Music,
  studio: Mic2,
  admin: Shield,
  collab: Handshake,
  bank: Landmark,
};

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
          className="min-h-full pb-24"
        >
          <button
            onClick={() => setOpenApp(null)}
            className="flex items-center gap-1 p-3 text-sm text-muted-foreground hover:text-foreground sticky top-0 z-50 bg-background/80 backdrop-blur-md w-full"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {openApp === 'spotify' && <SpotifyApp profile={profile} />}
          {openApp === 'apple-music' && <AppleMusicApp profile={profile} />}
          {openApp === 'youtube' && <YouTubeApp profile={profile} />}
          {openApp === 'youtube-music' && <YouTubeMusicApp profile={profile} />}
          {openApp === 'x' && <XApp profile={profile} />}
          {openApp === 'studio' && <StudioApp profile={profile} />}
          {openApp === 'collab' && <CollabApp profile={profile} />}
          {openApp === 'bank' && <BankApp profile={profile} />}
          {openApp === 'admin' && <AdminApp profile={profile} />}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="p-5">
      <h2 className="font-display text-lg font-bold mb-5">Your Apps</h2>
      <div className="grid grid-cols-3 gap-5">
        {apps.map((app) => {
          const Icon = APP_ICONS[app.id];
          return (
            <button
              key={app.id}
              onClick={() => setOpenApp(app.id)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-14 h-14 rounded-[14px] shadow-lg overflow-hidden flex items-center justify-center transition-transform active:scale-90 ${
                app.logo ? 'bg-secondary' : app.bgClass
              }`}>
                {app.logo ? (
                  <img src={app.logo} alt={app.name} className="w-full h-full object-contain p-1.5" />
                ) : Icon ? (
                  <Icon className="w-7 h-7 text-white" />
                ) : null}
              </div>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
