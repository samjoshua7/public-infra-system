import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Avatar,
  Divider,
  Badge,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import ExploreIcon from '@mui/icons-material/Explore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { signOut } from '../../features/auth/api';
import { ThemeToggleButton } from './ThemeToggleButton';

export const DesktopSidebar = () => {
  const { user, profile, role, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrent = (path) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const canAccessDashboard = role === 'GOVERNMENT_OFFICIAL' || role === 'ADMIN';
  const canAccessAdmin = role === 'ADMIN';

  const navItems = [
    {
      label: 'Public Feed',
      path: '/feed',
      icon: <DynamicFeedIcon sx={{ fontSize: 20 }} />,
      visible: role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Explore Issues',
      path: '/explore',
      icon: <ExploreIcon sx={{ fontSize: 20 }} />,
      visible: role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Activity',
      path: '/notifications',
      icon: (
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneIcon sx={{ fontSize: 20 }} />
        </Badge>
      ),
      visible: isAuthenticated,
    },
    {
      label: 'Official Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon sx={{ fontSize: 20 }} />,
      visible: canAccessDashboard,
    },
    {
      label: 'Admin Panel',
      path: '/admin',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />,
      visible: canAccessAdmin,
    },
  ];

  return (
    <Box
      component="aside"
      sx={{
        width: 240,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: 2.5,
        px: 2,
        zIndex: 1200,
      }}
    >
      <Box>
        {/* Brand Header */}
        <Box
          component={RouterLink}
          to={role === 'GOVERNMENT_OFFICIAL' ? '/dashboard' : '/feed'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            textDecoration: 'none',
            color: 'text.primary',
            px: 1,
            mb: 3,
          }}
        >
          <Avatar
            src="/logo.png"
            alt="Civic Voice Logo"
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.125rem',
              letterSpacing: '-0.02em',
            }}
          >
            Civic Voice
          </Typography>
        </Box>

        {/* Action Button: Report Issue */}
        {isAuthenticated && role !== 'GOVERNMENT_OFFICIAL' && (
          <Box sx={{ mb: 2.5 }}>
            <Button
              component={RouterLink}
              to="/report/new"
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
              sx={{
                py: 1,
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              Report Issue
            </Button>
          </Box>
        )}

        {/* Navigation List */}
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const active = isCurrent(item.path);
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      borderRadius: 1,
                      py: 1,
                      px: 1.5,
                      bgcolor: active
                        ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)')
                        : 'transparent',
                      color: active ? 'text.primary' : 'text.secondary',
                      fontWeight: active ? 600 : 500,
                      '&:hover': {
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                        color: 'text.primary',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? 'text.primary' : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.8125rem',
                        fontWeight: active ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
        </List>
      </Box>

      {/* Bottom User Profile / Auth Area */}
      <Box sx={{ pt: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">
            Theme
          </Typography>
          <ThemeToggleButton />
        </Box>

        {isAuthenticated ? (
          <Box>
            <Box
              component={RouterLink}
              to="/profile"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 1,
                borderRadius: 1,
                textDecoration: 'none',
                color: 'text.primary',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                },
              }}
            >
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
              <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                <Typography variant="body2" fontWeight="600" noWrap sx={{ fontSize: '0.8125rem', lineHeight: 1.2 }}>
                  {profile?.name || 'Citizen'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.6875rem' }}>
                  {role === 'ADMIN' ? 'Administrator' : role === 'GOVERNMENT_OFFICIAL' ? 'Official' : 'Citizen'}
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              color="inherit"
              fullWidth
              startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
              onClick={handleSignOut}
              sx={{
                mt: 1,
                justifyContent: 'flex-start',
                px: 1,
                py: 0.5,
                color: 'text.secondary',
                fontSize: '0.75rem',
                '&:hover': { color: 'error.main' },
              }}
            >
              Sign Out
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="small"
              fullWidth
            >
              Log In
            </Button>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              color="primary"
              size="small"
              fullWidth
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};
