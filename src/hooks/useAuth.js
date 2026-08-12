import { useAuthContext } from '../app/providers/AuthProvider';

export const useAuth = () => {
  const { session, user, profile, role, loading, refreshProfile } = useAuthContext();
  return {
    session,
    user,
    profile,
    role,
    isAuthenticated: !!session,
    loading,
    refreshProfile,
  };
};
