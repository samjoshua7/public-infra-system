import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { role, assignedDepartments, isAuthenticated } = useAuth();

  const isSuperOfficial =
    role === 'ADMIN' ||
    (role === 'GOVERNMENT_OFFICIAL' && assignedDepartments.includes('all'));

  const canManageCategory = (category) => {
    if (!isAuthenticated) return false;
    if (role === 'ADMIN') return true;
    if (role !== 'GOVERNMENT_OFFICIAL') return false;
    if (assignedDepartments.includes('all')) return true;
    return assignedDepartments.includes(category);
  };

  return {
    isCitizen: isAuthenticated && (role === 'CITIZEN' || !role),
    isOfficial: isAuthenticated && role === 'GOVERNMENT_OFFICIAL',
    isAdmin: isAuthenticated && role === 'ADMIN',
    isSuperOfficial,
    assignedDepartments,
    canUpdateStatus: isAuthenticated && (role === 'GOVERNMENT_OFFICIAL' || role === 'ADMIN'),
    canManageCategory,
    canModerate: isAuthenticated && role === 'ADMIN',
  };
};
