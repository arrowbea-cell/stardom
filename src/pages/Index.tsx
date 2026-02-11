import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import Auth from './Auth';
import { Disc3 } from 'lucide-react';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Disc3 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Auth />;
  if (!profile) return <Navigate to="/setup" replace />;
  return <Navigate to="/dashboard" replace />;
}
