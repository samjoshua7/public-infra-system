import { useAuthContext } from '../app/providers/AuthProvider';

export const useAuth = () => {
  const { session, user, profile, role, loading, refreshProfile } = useAuthContext();

  const approvalStatus = profile?.approval_status || (role === 'CITIZEN' ? 'pending' : 'approved');

  const isApproved = role === 'ADMIN' || role === 'GOVERNMENT_OFFICIAL' || approvalStatus === 'approved';
  const isPending = role === 'CITIZEN' && approvalStatus === 'pending';
  const isRejected = role === 'CITIZEN' && approvalStatus === 'rejected';

  return {
    session,
    user,
    profile,
    role,
    approvalStatus,
    isApproved,
    isPending,
    isRejected,
    isAuthenticated: !!session,
    loading,
    refreshProfile,
  };
};
