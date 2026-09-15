import React from 'react';
import { Box, Typography, Badge } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AddBoxIcon from '@mui/icons-material/AddBox';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';

import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

export const MobileBottomNav = () => {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();
  const { unreadCount } = useNotifications();

  const isCurrent = (path) => location.pathname === path;

  const canAccessDashboard = role === 'GOVERNMENT_OFFICIAL' || role === 'ADMIN';

  const tabs = [
    {
      label: 'Feed',
      path: '/feed',
      icon: <DynamicFeedIcon sx={{ fontSize: 22 }} />,
      visible: role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Explore',
      path: '/explore',
      icon: <ExploreOutlinedIcon sx={{ fontSize: 22 }} />,
      visible: role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Report',
      path: '/report/new',
      icon: <AddBoxIcon sx={{ fontSize: 24 }} />,
      isAction: true,
      visible: isAuthenticated && role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      label: 'Activity',
      path: '/notifications',
      icon: (
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsNoneIcon sx={{ fontSize: 22 }} />
        </Badge>
      ),
      visible: isAuthenticated,
    },
    {
      label: canAccessDashboard ? 'Dashboard' : 'Profile',
      path: canAccessDashboard ? '/dashboard' : '/profile',
      icon: canAccessDashboard ? <DashboardOutlinedIcon sx={{ fontSize: 22 }} /> : <PersonOutlineIcon sx={{ fontSize: 22 }} />,
      visible: isAuthenticated,
    },
  ].filter((t) => t.visible);

  return (
    <Box
      component="nav"
      aria-label="Mobile navigation"
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        bgcolor: 'background.paper',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        zIndex: 1200,
        justifyContent: 'space-around',
        alignItems: 'center',
        px: 1,
      }}
    >
      {tabs.map((tab) => {
        const active = isCurrent(tab.path);
        return (
          <Box
            key={tab.path}
            component={RouterLink}
            to={tab.path}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              flexGrow: 1,
              height: '100%',
              gap: '2px',
              color: active ? 'text.primary' : 'text.secondary',
              transition: 'color 0.15s ease',
              '&:active': {
                opacity: 0.7,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: active ? 'text.primary' : 'inherit',
              }}
            >
              {tab.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6875rem',
                fontWeight: active ? 700 : 500,
                lineHeight: 1,
                color: active ? 'text.primary' : 'inherit',
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};
