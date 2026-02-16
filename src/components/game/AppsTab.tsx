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
import AwardsApp from '@/components/apps/AwardsApp';
import MerchApp from '@/components/apps/MerchApp';
import NewsApp from '@/components/apps/NewsApp';
import ConcertApp from '@/components/apps/ConcertApp';
import RecordLabelApp from '@/components/apps/RecordLabelApp';
import BeefApp from '@/components/apps/BeefApp';
import FanMailApp from '@/components/apps/FanMailApp';
import RadioApp from '@/components/apps/RadioApp';
import PitchforkApp from '@/components/apps/PitchforkApp';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic2, Shield, Music, Handshake, Landmark, Trophy, ShoppingBag, Newspaper, Ticket, Building2, Swords, Mail, Radio, BookOpen, Disc3 } from 'lucide-react';

interface Props {
  profile: Profile;
}

type AppType = 'spotify' | 'apple-music' | 'youtube' | 'youtube-music' | 'x' | 'studio' | 'admin' | 'collab' | 'bank' | 'awards' | 'merch' | 'news' | 'concert' | 'label' | 'beef' | 'fan-mail' | 'radio' | 'pitchfork' | null;

const apps = [
  { id: 'spotify' as const, name: 'Spotify', logo: spotifyLogo, bgClass: 'bg-[#121212]' },
  { id: 'apple-music' as const, name: 'Apple Music', logo: appleMusicLogo, bgClass: 'bg-gradient-to-br from-[#fc3c44] to-[#8b5cf6]' },
  { id: 'youtube' as const, name: 'YouTube', logo: youtubeLogo, bgClass: 'bg-[#0f0f0f]' },
  { id: 'youtube-music' as const, name: 'YT Music', logo: null, bgClass: 'bg-gradient-to-br from-[#ff0000] to-[#cc0000]' },
  { id: 'x' as const, name: 'X', logo: xLogo, bgClass: 'bg-[#000000]' },
  { id: 'studio' as const, name: 'Studio', logo: null, bgClass: 'bg-gradient-to-br from-[#1db954] to-[#148a3c]' },
  { id: 'concert' as const, name: 'Concerts', logo: null, bgClass: 'bg-gradient-to-br from-[#7c3aed] to-[#5b21b6]' },
  { id: 'label' as const, name: 'Labels', logo: null, bgClass: 'bg-gradient-to-br from-[#0ea5e9] to-[#0369a1]' },
  { id: 'radio' as const, name: 'Radio', logo: null, bgClass: 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]' },
  { id: 'collab' as const, name: 'Collabs', logo: null, bgClass: 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]' },
  { id: 'beef' as const, name: 'Beef', logo: null, bgClass: 'bg-gradient-to-br from-[#ef4444] to-[#b91c1c]' },
  { id: 'bank' as const, name: 'Bank', logo: null, bgClass: 'bg-gradient-to-br from-[#10b981] to-[#059669]' },
  { id: 'merch' as const, name: 'Merch', logo: null, bgClass: 'bg-gradient-to-br from-[#ec4899] to-[#be185d]' },
  { id: 'fan-mail' as const, name: 'Fan Mail', logo: null, bgClass: 'bg-gradient-to-br from-[#f472b6] to-[#db2777]' },
  { id: 'awards' as const, name: 'Awards', logo: null, bgClass: 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]' },
  { id: 'news' as const, name: 'News', logo: null, bgClass: 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2]' },
  { id: 'pitchfork' as const, name: 'Pitchfork', logo: null, bgClass: 'bg-gradient-to-br from-[#222] to-[#000]' },
  { id: 'admin' as const, name: 'Admin', logo: null, bgClass: 'bg-gradient-to-br from-[#ef4444] to-[#f97316]' },
];

const APP_ICONS: Record<string, any> = {
  'youtube-music': Music,
  studio: Mic2,
  admin: Shield,
  collab: Handshake,
  bank: Landmark,
  awards: Trophy,
  merch: ShoppingBag,
  news: Newspaper,
  concert: Ticket,
  label: Building2,
  beef: Swords,
  'fan-mail': Mail,
  radio: Radio,
  pitchfork: BookOpen,
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
          className="flex flex-col h-[calc(100vh-44px)]"
        >
          <button
            onClick={() => setOpenApp(null)}
            className="flex items-center gap-1 p-3 text-sm text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-md w-full flex-shrink-0 z-50"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex-1 min-h-0">
            {openApp === 'spotify' && <SpotifyApp profile={profile} />}
            {openApp === 'apple-music' && <AppleMusicApp profile={profile} />}
            {openApp === 'youtube' && <YouTubeApp profile={profile} />}
            {openApp === 'youtube-music' && <YouTubeMusicApp profile={profile} />}
            {openApp === 'x' && <XApp profile={profile} />}
            {openApp === 'studio' && <StudioApp profile={profile} />}
            {openApp === 'collab' && <CollabApp profile={profile} />}
            {openApp === 'bank' && <BankApp profile={profile} />}
            {openApp === 'awards' && <AwardsApp profile={profile} />}
            {openApp === 'merch' && <MerchApp profile={profile} />}
            {openApp === 'news' && <NewsApp profile={profile} />}
            {openApp === 'concert' && <ConcertApp profile={profile} />}
            {openApp === 'label' && <RecordLabelApp profile={profile} />}
            {openApp === 'beef' && <BeefApp profile={profile} />}
            {openApp === 'fan-mail' && <FanMailApp profile={profile} />}
            {openApp === 'radio' && <RadioApp profile={profile} />}
            {openApp === 'pitchfork' && <PitchforkApp profile={profile} />}
            {openApp === 'admin' && <AdminApp profile={profile} />}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="p-5 pb-24">
      <h2 className="font-display text-lg font-bold mb-5">Your Apps</h2>
      <div className="grid grid-cols-4 gap-4">
        {apps.map((app) => {
          const Icon = APP_ICONS[app.id];
          return (
            <button
              key={app.id}
              onClick={() => setOpenApp(app.id)}
              className="flex flex-col items-center gap-1.5 group"
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
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
