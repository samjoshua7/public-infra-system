import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../features/auth/api';
import { ThemeToggleButton } from './ThemeToggleButton';

export const AppHeader = () => {
  const { user, profile, role, isAuthenticated } = useAuth();
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

  const getRoleLabel = () => {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'GOVERNMENT_OFFICIAL') return 'Official';
    return 'Citizen';
  };

  const getRoleColor = () => {
    if (role === 'ADMIN') return 'error';
    if (role === 'GOVERNMENT_OFFICIAL') return 'warning';
    return 'default';
  };


  return (
    <AppBar position="sticky" color="default" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, gap: 2 }}>
          {/* Logo & Brand */}
          <Box
            component={RouterLink}
            to="/feed"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'inherit',
              mr: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                width: 36,
                height: 36,
              }}
            >
              <LocationCityIcon fontSize="small" />
            </Avatar>
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}
            >
              CivicPulse
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            <Button
              component={RouterLink}
              to="/feed"
              startIcon={<DynamicFeedIcon />}
              color={location.pathname === '/feed' || location.pathname === '/' ? 'primary' : 'inherit'}
              size="small"
              sx={{ fontWeight: 600 }}
            >
              Public Feed
            </Button>
            {isAuthenticated && (
              <Button
                component={RouterLink}
                to="/report/new"
                startIcon={<AddCircleOutlineIcon />}
                variant="contained"
                color="primary"
                size="small"
                sx={{ fontWeight: 600 }}
              >
                Report Issue
              </Button>
            )}
          </Box>

          {/* Action buttons & User menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ThemeToggleButton />

            {isAuthenticated ? (
              <>
                <Chip
                  label={getRoleLabel()}
                  color={getRoleColor()}
                  size="small"
                  variant="outlined"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 600 }}
                />
                <IconButton onClick={handleMenuOpen} size="small">
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: 'secondary.main',
                      fontSize: '0.875rem',
                      fontWeight: 600,
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
                    <Typography variant="subtitle2" noWrap>
                      {profile?.name || 'Citizen'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {user?.email}
                    </Typography>
                  </Box>
                  <MenuItem onClick={handleSignOut} sx={{ color: 'error.main', gap: 1 }}>
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
                  size="small"
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
