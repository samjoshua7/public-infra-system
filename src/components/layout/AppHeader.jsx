import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { signOut } from '../../features/auth/api';
import { ThemeToggleButton } from './ThemeToggleButton';

export const AppHeader = () => {
  const { user, profile, role, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
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

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/feed')) return 'Public Infrastructure Feed';
    if (p.startsWith('/explore')) return 'Explore Infrastructure Issues';
    if (p.startsWith('/report/new')) return 'Report Infrastructure Issue';
    if (p.startsWith('/report/')) return 'Report Details';
    if (p.startsWith('/dashboard')) return 'Official Status Pipeline Dashboard';
    if (p.startsWith('/admin')) return 'Administration & User Management';
    if (p.startsWith('/notifications')) return 'Activity & Notifications';
    if (p.startsWith('/profile')) return 'Citizen Profile';
    return 'Civic Voice';
  };

  const getRoleLabel = () => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'GOVERNMENT_OFFICIAL') return 'Official';
    return 'Citizen';
  };

  const canAccessDashboard = role === 'GOVERNMENT_OFFICIAL' || role === 'ADMIN';
  const canAccessAdmin = role === 'ADMIN';

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        display: { xs: 'none', md: 'flex' },
        bgcolor: 'background.paper',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 56,
          height: 56,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Current Section Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: 'text.primary',
            letterSpacing: '-0.01em',
          }}
        >
          {getPageTitle()}
        </Typography>

        {/* Right Section: Role, Notifications, Theme Toggle, Account */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isAuthenticated && (
            <Tooltip title="Notifications">
              <IconButton
                component={RouterLink}
                to="/notifications"
                size="small"
                aria-label="Activity and notifications"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <NotificationsNoneIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          <ThemeToggleButton />

          {isAuthenticated ? (
            <>
              <Chip
                label={getRoleLabel()}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 1,
                  height: 24,
                }}
              />

              <IconButton
                onClick={handleMenuOpen}
                size="small"
                aria-label="User profile menu"
                sx={{ p: 0.5 }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: 'secondary.main',
                    color: '#FFFFFF',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 1,
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

                <MenuItem
                  component={RouterLink}
                  to="/profile"
                  onClick={handleMenuClose}
                  sx={{ gap: 1.25, fontSize: '0.8125rem' }}
                >
                  <AccountCircleIcon fontSize="small" />
                  My Profile
                </MenuItem>

                {canAccessDashboard && (
                  <MenuItem
                    component={RouterLink}
                    to="/dashboard"
                    onClick={handleMenuClose}
                    sx={{ gap: 1.25, fontSize: '0.8125rem' }}
                  >
                    <DashboardIcon fontSize="small" />
                    Official Dashboard
                  </MenuItem>
                )}

                {canAccessAdmin && (
                  <MenuItem
                    component={RouterLink}
                    to="/admin"
                    onClick={handleMenuClose}
                    sx={{ gap: 1.25, fontSize: '0.8125rem' }}
                  >
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="small"
              >
                Log In
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                color="primary"
                size="small"
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
