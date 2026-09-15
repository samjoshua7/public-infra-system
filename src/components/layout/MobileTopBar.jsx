import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { signOut } from '../../features/auth/api';
import { ThemeToggleButton } from './ThemeToggleButton';

export const MobileTopBar = () => {
  const { user, profile, role, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleSignOut = async () => {
    handleMenuClose();
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const canAccessDashboard = role === 'GOVERNMENT_OFFICIAL' || role === 'ADMIN';
  const canAccessAdmin = role === 'ADMIN';

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        display: { xs: 'flex', md: 'none' },
        bgcolor: 'background.paper',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        zIndex: 1100,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: 52,
          height: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
        }}
      >
        {/* Brand */}
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
            src="/logo.png"
            alt="Civic Voice Logo"
            variant="rounded"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Civic Voice
          </Typography>
        </Box>

        {/* Right Controls: Notifications, Theme Toggle & Avatar Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {isAuthenticated && (
            <IconButton
              component={RouterLink}
              to="/notifications"
              size="small"
              aria-label="Notifications"
              sx={{ color: 'text.secondary' }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsNoneIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          )}

          <ThemeToggleButton />

          {isAuthenticated ? (
            <>
              <IconButton size="small" onClick={handleMenuOpen} aria-label="Account menu">
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: 'secondary.main',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 0.75,
                  }}
                >
                  {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" noWrap fontWeight="600" sx={{ fontSize: '0.8125rem' }}>
                    {profile?.name || 'Citizen'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {user?.email}
                  </Typography>
                </Box>

                <Divider />

                <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose} sx={{ gap: 1.25, fontSize: '0.8125rem' }}>
                  <AccountCircleIcon fontSize="small" />
                  My Profile
                </MenuItem>

                {canAccessDashboard && (
                  <MenuItem component={RouterLink} to="/dashboard" onClick={handleMenuClose} sx={{ gap: 1.25, fontSize: '0.8125rem' }}>
                    <DashboardIcon fontSize="small" />
                    Official Dashboard
                  </MenuItem>
                )}

                {canAccessAdmin && (
                  <MenuItem component={RouterLink} to="/admin" onClick={handleMenuClose} sx={{ gap: 1.25, fontSize: '0.8125rem' }}>
                    <AdminPanelSettingsIcon fontSize="small" />
                    Admin Panel
                  </MenuItem>
                )}

                <Divider />

                <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', gap: 1.25, fontSize: '0.8125rem' }}>
                  <LogoutIcon fontSize="small" />
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box
              component={RouterLink}
              to="/login"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontSize: '0.8125rem',
                fontWeight: 600,
                px: 1,
              }}
            >
              Log In
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
