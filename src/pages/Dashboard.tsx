import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid3X3, BarChart3, Stamp, Plane, Crown, User, DollarSign, Clock, LogOut } from 'lucide-react';
import HomeTab from '@/components/game/HomeTab';
import AppsTab from '@/components/game/AppsTab';
import ChartsTab from '@/components/game/ChartsTab';
import ProfileTab from '@/components/game/ProfileTab';
import VisaTab from '@/components/game/VisaTab';
import TravelTab from '@/components/game/TravelTab';
import LifestyleTab from '@/components/game/LifestyleTab';

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'apps', label: 'Apps', icon: Grid3X3 },
  { id: 'charts', label: 'Charts', icon: BarChart3 },
  { id: 'visa', label: 'Visa', icon: Stamp },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'lifestyle', label: 'Style', icon: Crown },
  { id: 'profile', label: 'Profile', icon: User },
] as const;
type Tab = typeof TABS[number]['id'];

export default function Dashboard() {
  const { profile } = useProfile();
  const { gameState, formatTimeLeft } = useGameState();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background flex max-w-lg md:max-w-full mx-auto relative">
      {/* Side nav rail — monochrome, hollow icons */}
      <nav className="sticky top-0 h-screen w-[52px] flex-shrink-0 bg-background border-r border-border/30 z-50 flex flex-col items-center py-4 gap-0.5 overflow-y-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-md transition-all w-10 group ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <Icon className="w-[18px] h-[18px] hollow-icon" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[7px] font-medium leading-tight tracking-wide uppercase">{tab.label}</span>
              {isActive && (
                <motion.div layoutId="nav-indicator" className="w-1 h-1 rounded-full bg-foreground mt-0.5" />
              )}
            </button>
          );
        })}
        <div className="mt-auto">
          <button onClick={signOut} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4 hollow-icon" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Status bar — minimal */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-background/90 backdrop-blur-sm sticky top-0 z-40 border-b border-border/20">
          <div className="flex items-center gap-2.5">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-border/50" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                {profile.artist_name[0]}
              </div>
            )}
            <span className="font-display font-semibold text-xs tracking-tight">{profile.artist_name}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] mono">
            <div className="flex items-center gap-1 text-foreground/80">
              <Clock className="w-3 h-3 hollow-icon" strokeWidth={1.5} />
              <span>{formatTimeLeft()}</span>
            </div>
            <span className="text-muted-foreground">T{gameState?.current_turn ?? 0}</span>
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <DollarSign className="w-3 h-3 hollow-icon" strokeWidth={1.5} />
              <span>{formatMoney(profile.current_money)}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="flex-1 overflow-auto"
          >
            {activeTab === 'home' && <HomeTab profile={profile} />}
            {activeTab === 'apps' && <AppsTab profile={profile} />}
            {activeTab === 'charts' && <ChartsTab />}
            {activeTab === 'visa' && <VisaTab profile={profile} />}
            {activeTab === 'travel' && <TravelTab profile={profile} />}
            {activeTab === 'lifestyle' && <LifestyleTab profile={profile} />}
            {activeTab === 'profile' && <ProfileTab profile={profile} />}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
