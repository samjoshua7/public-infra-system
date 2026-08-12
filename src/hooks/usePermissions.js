import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { role, isAuthenticated } = useAuth();

  return {
    isCitizen: isAuthenticated && (role === 'CITIZEN' || !role),
    isOfficial: isAuthenticated && role === 'GOVERNMENT_OFFICIAL',
    isAdmin: isAuthenticated && role === 'ADMIN',
    canUpdateStatus: isAuthenticated && (role === 'GOVERNMENT_OFFICIAL' || role === 'ADMIN'),
    canModerate: isAuthenticated && role === 'ADMIN',
  };
};
