import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { motion } from 'framer-motion';
import { Home, Grid3X3, BarChart3, Stamp, Plane, Crown, User, DollarSign, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Status bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/50">
        <div className="flex items-center gap-2">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs">
              {profile.artist_name[0]}
            </div>
          )}
          <span className="font-display font-semibold text-xs truncate max-w-[100px]">{profile.artist_name}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1 text-primary font-mono">
            <Clock className="w-3 h-3" />
            {formatTimeLeft()}
          </div>
          <span className="text-muted-foreground">T{gameState?.current_turn ?? 0}</span>
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            <span>{formatMoney(profile.current_money)}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <motion.main
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex-1 overflow-auto pb-20"
      >
        {activeTab === 'home' && <HomeTab profile={profile} />}
        {activeTab === 'apps' && <AppsTab profile={profile} />}
        {activeTab === 'charts' && <ChartsTab />}
        {activeTab === 'visa' && <VisaTab profile={profile} />}
        {activeTab === 'travel' && <TravelTab profile={profile} />}
        {activeTab === 'lifestyle' && <LifestyleTab profile={profile} />}
        {activeTab === 'profile' && <ProfileTab profile={profile} />}
      </motion.main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[42px] ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-[9px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
