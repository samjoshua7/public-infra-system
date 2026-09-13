import React from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { useThemeMode } from '../../app/providers/ThemeModeProvider';
import { useAuth } from '../../hooks/useAuth';

export const MobileTopBar = () => {
  const { mode, toggleThemeMode } = useThemeMode();
  const { isAuthenticated, role } = useAuth();

  return (
    <Box
      component="header"
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'sticky',
        top: 0,
        height: 52,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        zIndex: 1100,
      }}
    >
      <Box
        component={RouterLink}
        to={role === 'GOVERNMENT_OFFICIAL' ? '/dashboard' : '/feed'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          textDecoration: 'none',
          color: 'text.primary',
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            color: '#FFFFFF',
            width: 28,
            height: 28,
          }}
        >
          <LocationCityIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: '1.2rem',
            letterSpacing: '-0.03em',
            color: 'primary.main',
          }}
        >
          Civic Voice
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton size="small" onClick={toggleThemeMode} color="inherit" aria-label="Toggle theme">
          {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
        </IconButton>

        {isAuthenticated && (
          <IconButton
            size="small"
            component={RouterLink}
            to="/notifications"
            color="inherit"
            aria-label="Notifications"
          >
            <FavoriteBorderIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};
