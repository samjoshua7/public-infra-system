import React from 'react';
import { Box, IconButton, Avatar } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ExploreIcon from '@mui/icons-material/Explore';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

import { useAuth } from '../../hooks/useAuth';

export const MobileBottomNav = () => {
  const { user, profile, role, isAuthenticated } = useAuth();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <Box
      component="nav"
      aria-label="Mobile Navigation"
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        justifyContent: 'space-around',
        alignItems: 'center',
        px: 1,
        pb: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 1300,
      }}
    >
      {/* Home */}
      <IconButton
        component={RouterLink}
        to={role === 'GOVERNMENT_OFFICIAL' ? '/dashboard' : '/feed'}
        color="inherit"
        sx={{ p: 1.25 }}
        aria-label="Home Feed"
      >
        {isCurrent('/feed') ? <HomeIcon fontSize="medium" /> : <HomeOutlinedIcon fontSize="medium" />}
      </IconButton>

      {/* Explore */}
      <IconButton
        component={RouterLink}
        to="/explore"
        color="inherit"
        sx={{ p: 1.25 }}
        aria-label="Explore"
      >
        {isCurrent('/explore') ? <ExploreIcon fontSize="medium" /> : <ExploreOutlinedIcon fontSize="medium" />}
      </IconButton>

      {/* Create Post Button */}
      {role !== 'GOVERNMENT_OFFICIAL' && (
        <IconButton
          component={RouterLink}
          to="/report/new"
          sx={{
            p: 0.5,
            color: 'primary.main',
            transform: 'scale(1.1)',
            transition: 'transform 0.15s ease',
            '&:active': { transform: 'scale(0.95)' },
          }}
          aria-label="Report new issue"
        >
          <AddCircleIcon sx={{ fontSize: 34 }} />
        </IconButton>
      )}

      {/* Activity / Notifications */}
      <IconButton
        component={RouterLink}
        to={isAuthenticated ? '/notifications' : '/login'}
        color="inherit"
        sx={{ p: 1.25 }}
        aria-label="Activity"
      >
        {isCurrent('/notifications') ? (
          <FavoriteIcon color="error" fontSize="medium" />
        ) : (
          <FavoriteBorderIcon fontSize="medium" />
        )}
      </IconButton>

      {/* Profile */}
      <IconButton
        component={RouterLink}
        to={isAuthenticated ? '/profile' : '/login'}
        color="inherit"
        sx={{ p: 1 }}
        aria-label="Profile"
      >
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: 'secondary.main',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: isCurrent('/profile') ? '2px solid' : 'none',
            borderColor: 'primary.main',
          }}
        >
          {isAuthenticated ? (profile?.name || user?.email || 'U').charAt(0).toUpperCase() : '?'}
        </Avatar>
      </IconButton>
    </Box>
  );
};
