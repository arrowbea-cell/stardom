import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber, formatMoney } from '@/lib/supabase-helpers';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Music, Users, LogOut } from 'lucide-react';
import HomeTab from '@/components/game/HomeTab';
import AppsTab from '@/components/game/AppsTab';
import ChartsTab from '@/components/game/ChartsTab';
import ProfileTab from '@/components/game/ProfileTab';

const TABS = ['Home', 'Apps', 'Charts', 'Profile'] as const;
type Tab = typeof TABS[number];

export default function Dashboard() {
  const { profile } = useProfile();
  const { gameState, formatTimeLeft } = useGameState();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Home');

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="font-display font-semibold text-sm">{profile.artist_name}</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTimeLeft()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Turn {gameState?.current_turn ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{formatMoney(profile.current_money)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{formatNumber(profile.monthly_listeners)}</span>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground ml-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="flex border-b border-border bg-card/30">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === tab ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <motion.main
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-auto"
      >
        {activeTab === 'Home' && <HomeTab profile={profile} />}
        {activeTab === 'Apps' && <AppsTab profile={profile} />}
        {activeTab === 'Charts' && <ChartsTab />}
        {activeTab === 'Profile' && <ProfileTab profile={profile} />}
      </motion.main>
    </div>
  );
}
