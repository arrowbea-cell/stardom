import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import Setup from './Setup';

export default function Index() {
  const { profile, loading } = useProfile();

  if (!loading && profile) return <Navigate to="/dashboard" replace />;
  return <Setup />;
}
