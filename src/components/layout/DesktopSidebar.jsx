import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ExploreIcon from '@mui/icons-material/Explore';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../app/providers/ThemeModeProvider';
import { signOut } from '../../features/auth/api';

export const DesktopSidebar = () => {
  const { user, profile, role, isAuthenticated } = useAuth();
  const { mode, toggleThemeMode } = useThemeMode();
  const location = useLocation();
  const navigate = useNavigate();

  const [moreAnchor, setMoreAnchor] = useState(null);

  const isCurrent = (path) => location.pathname === path;

  const handleMenuOpen = (e) => setMoreAnchor(e.currentTarget);
  const handleMenuClose = () => setMoreAnchor(null);

  const handleSignOut = async () => {
    handleMenuClose();
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
      label: 'Home',
      path: '/feed',
      icon: isCurrent('/feed') ? <HomeIcon /> : <HomeOutlinedIcon />,
      visible: role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Explore',
      path: '/explore',
      icon: isCurrent('/explore') ? <ExploreIcon /> : <ExploreOutlinedIcon />,
      visible: role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Create',
      path: '/report/new',
      icon: isCurrent('/report/new') ? <AddBoxIcon color="primary" /> : <AddBoxOutlinedIcon />,
      visible: isAuthenticated && role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Activity',
      path: '/notifications',
      icon: isCurrent('/notifications') ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />,
      visible: isAuthenticated,
    },
    {
      label: 'Official Dashboard',
      path: '/dashboard',
      icon: isCurrent('/dashboard') ? <DashboardIcon color="warning" /> : <DashboardOutlinedIcon />,
      visible: canAccessDashboard,
    },
    {
      label: 'Admin Panel',
      path: '/admin',
      icon: isCurrent('/admin') ? <AdminPanelSettingsIcon color="error" /> : <AdminPanelSettingsOutlinedIcon />,
      visible: canAccessAdmin,
    },
  ];

  return (
    <Box
      component="nav"
      sx={{
        width: { md: 76, lg: 240 },
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: 3,
        px: { md: 1, lg: 2 },
        zIndex: 1200,
        transition: 'width 0.2s ease',
      }}
    >
      <Box>
        {/* Logo / Brand */}
        <Box
          component={RouterLink}
          to={role === 'GOVERNMENT_OFFICIAL' ? '/dashboard' : '/feed'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textDecoration: 'none',
            color: 'text.primary',
            px: { md: 1, lg: 1.5 },
            mb: 4,
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: '#FFFFFF',
              width: 36,
              height: 36,
              boxShadow: '0 2px 8px rgba(0, 149, 246, 0.4)',
            }}
          >
            <LocationCityIcon fontSize="small" />
          </Avatar>
          <Typography
            variant="h6"
            sx={{
              display: { md: 'none', lg: 'block' },
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontSize: '1.25rem',
              color: 'primary.main',
            }}
          >
            Civic Voice
          </Typography>
        </Box>

        {/* Navigation Items */}
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const active = isCurrent(item.path);
              return (
                <ListItem key={item.path} disablePadding>
                  <Tooltip title={item.label} placement="right" disableHoverListener={{ lg: true }}>
                    <ListItemButton
                      component={RouterLink}
                      to={item.path}
                      sx={{
                        borderRadius: 2.5,
                        py: 1.25,
                        px: { md: 1.5, lg: 2 },
                        bgcolor: active ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)') : 'transparent',
                        '&:hover': {
                          bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: { md: 'auto', lg: 40 },
                          color: active ? 'primary.main' : 'text.primary',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: active ? 700 : 500,
                          fontSize: '0.9375rem',
                          color: active ? 'text.primary' : 'text.secondary',
                        }}
                        sx={{ display: { md: 'none', lg: 'block' }, m: 0 }}
                      />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}

          {/* Profile Item */}
          {isAuthenticated ? (
            <ListItem disablePadding>
              <Tooltip title="Profile" placement="right" disableHoverListener={{ lg: true }}>
                <ListItemButton
                  component={RouterLink}
                  to="/profile"
                  sx={{
                    borderRadius: 2.5,
                    py: 1.25,
                    px: { md: 1.5, lg: 2 },
                    bgcolor: isCurrent('/profile') ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)') : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { md: 'auto', lg: 40 }, justifyContent: 'center' }}>
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        bgcolor: 'secondary.main',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: isCurrent('/profile') ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                      }}
                    >
                      {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Profile"
                    primaryTypographyProps={{
                      fontWeight: isCurrent('/profile') ? 700 : 500,
                      fontSize: '0.9375rem',
                      color: isCurrent('/profile') ? 'text.primary' : 'text.secondary',
                    }}
                    sx={{ display: { md: 'none', lg: 'block' }, m: 0 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ) : (
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/login"
                sx={{
                  borderRadius: 2.5,
                  py: 1.25,
                  px: { md: 1.5, lg: 2 },
                }}
              >
                <ListItemIcon sx={{ minWidth: { md: 'auto', lg: 40 }, justifyContent: 'center' }}>
                  <Avatar sx={{ width: 26, height: 26, bgcolor: 'text.secondary', fontSize: '0.75rem' }}>?</Avatar>
                </ListItemIcon>
                <ListItemText
                  primary="Sign In"
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9375rem' }}
                  sx={{ display: { md: 'none', lg: 'block' }, m: 0 }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Bottom Actions: Theme Toggle & More Menu */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'} placement="right" disableHoverListener={{ lg: true }}>
          <ListItemButton
            onClick={toggleThemeMode}
            sx={{
              borderRadius: 2.5,
              py: 1.25,
              px: { md: 1.5, lg: 2 },
            }}
          >
            <ListItemIcon sx={{ minWidth: { md: 'auto', lg: 40 }, color: 'text.primary', justifyContent: 'center' }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </ListItemIcon>
            <ListItemText
              primary={mode === 'dark' ? 'Light mode' : 'Dark mode'}
              primaryTypographyProps={{ fontSize: '0.9375rem', color: 'text.secondary' }}
              sx={{ display: { md: 'none', lg: 'block' }, m: 0 }}
            />
          </ListItemButton>
        </Tooltip>

        {isAuthenticated && (
          <>
            <Tooltip title="More" placement="right" disableHoverListener={{ lg: true }}>
              <ListItemButton
                onClick={handleMenuOpen}
                sx={{
                  borderRadius: 2.5,
                  py: 1.25,
                  px: { md: 1.5, lg: 2 },
                }}
              >
                <ListItemIcon sx={{ minWidth: { md: 'auto', lg: 40 }, color: 'text.primary', justifyContent: 'center' }}>
                  <MenuIcon />
                </ListItemIcon>
                <ListItemText
                  primary="More"
                  primaryTypographyProps={{ fontSize: '0.9375rem', color: 'text.secondary' }}
                  sx={{ display: { md: 'none', lg: 'block' }, m: 0 }}
                />
              </ListItemButton>
            </Tooltip>

            <Menu
              anchorEl={moreAnchor}
              open={Boolean(moreAnchor)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: 200,
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    p: 1,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" noWrap fontWeight="700">
                  {profile?.name || 'Citizen'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email}
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose} sx={{ borderRadius: 2 }}>
                Profile
              </MenuItem>

              {canAccessDashboard && (
                <MenuItem component={RouterLink} to="/dashboard" onClick={handleMenuClose} sx={{ borderRadius: 2 }}>
                  Official Dashboard
                </MenuItem>
              )}

              {canAccessAdmin && (
                <MenuItem component={RouterLink} to="/admin" onClick={handleMenuClose} sx={{ borderRadius: 2 }}>
                  Admin Panel
                </MenuItem>
              )}

              <Divider sx={{ my: 1 }} />

              <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', borderRadius: 2, gap: 1 }}>
                <LogoutIcon fontSize="small" />
                Log out
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Box>
  );
};
