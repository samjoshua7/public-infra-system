import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

export const RoleGuard = ({ allowedRoles = null, excludedRoles = [], children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={36} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isExcluded = excludedRoles.length > 0 && excludedRoles.includes(role);
  const isNotAllowed = allowedRoles !== null && !allowedRoles.includes(role);

  if (isExcluded || isNotAllowed) {
    const fallback = role === 'GOVERNMENT_OFFICIAL' ? '/dashboard' : '/feed';
    return <Navigate to={fallback} replace />;
  }

  return children;
};
