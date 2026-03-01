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
import MusicVideoApp from '@/components/apps/MusicVideoApp';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic2, Shield, Music, Handshake, Landmark, Trophy, ShoppingBag, Newspaper, Ticket, Building2, Swords, Mail, Radio, BookOpen, Film } from 'lucide-react';

interface Props {
  profile: Profile;
}

type AppType = 'spotify' | 'apple-music' | 'youtube' | 'youtube-music' | 'x' | 'studio' | 'admin' | 'collab' | 'bank' | 'awards' | 'merch' | 'news' | 'concert' | 'label' | 'beef' | 'fan-mail' | 'radio' | 'pitchfork' | 'music-video' | null;

const apps = [
  { id: 'spotify' as const, name: 'Spotify', logo: spotifyLogo },
  { id: 'apple-music' as const, name: 'Apple Music', logo: appleMusicLogo },
  { id: 'youtube' as const, name: 'YouTube', logo: youtubeLogo },
  { id: 'youtube-music' as const, name: 'YT Music', logo: null, icon: Music },
  { id: 'x' as const, name: 'X', logo: xLogo },
  { id: 'studio' as const, name: 'Studio', logo: null, icon: Mic2 },
  { id: 'music-video' as const, name: 'Videos', logo: null, icon: Film },
  { id: 'concert' as const, name: 'Concerts', logo: null, icon: Ticket },
  { id: 'label' as const, name: 'Labels', logo: null, icon: Building2 },
  { id: 'radio' as const, name: 'Radio', logo: null, icon: Radio },
  { id: 'collab' as const, name: 'Collabs', logo: null, icon: Handshake },
  { id: 'beef' as const, name: 'Beef', logo: null, icon: Swords },
  { id: 'bank' as const, name: 'Bank', logo: null, icon: Landmark },
  { id: 'merch' as const, name: 'Merch', logo: null, icon: ShoppingBag },
  { id: 'fan-mail' as const, name: 'Fan Mail', logo: null, icon: Mail },
  { id: 'awards' as const, name: 'Awards', logo: null, icon: Trophy },
  { id: 'news' as const, name: 'News', logo: null, icon: Newspaper },
  { id: 'pitchfork' as const, name: 'Pitchfork', logo: null, icon: BookOpen },
  { id: 'admin' as const, name: 'Admin', logo: null, icon: Shield },
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
          className="flex flex-col h-[calc(100vh-44px)]"
        >
          <button
            onClick={() => setOpenApp(null)}
            className="flex items-center gap-1 p-3 text-xs text-muted-foreground hover:text-foreground bg-background w-full flex-shrink-0 z-50 border-b border-border/20"
          >
            <ChevronLeft className="w-3.5 h-3.5 hollow-icon" strokeWidth={1.5} /> Back
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
            {openApp === 'music-video' && <MusicVideoApp profile={profile} />}
            {openApp === 'admin' && <AdminApp profile={profile} />}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Apps</h2>
      <div className="grid grid-cols-4 gap-3">
        {apps.map((app) => {
          const Icon = (app as any).icon;
          return (
            <button
              key={app.id}
              onClick={() => setOpenApp(app.id)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-xl border border-border/50 bg-card/50 overflow-hidden flex items-center justify-center transition-all group-hover:border-foreground/30 group-active:scale-90">
                {app.logo ? (
                  <img src={app.logo} alt={app.name} className="w-full h-full object-contain p-1.5" />
                ) : Icon ? (
                  <Icon className="w-5 h-5 text-foreground/70 hollow-icon" strokeWidth={1.5} />
                ) : null}
              </div>
              <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
