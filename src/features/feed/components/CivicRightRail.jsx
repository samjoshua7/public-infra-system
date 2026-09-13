import React from 'react';
import { Box, Typography, Avatar, Button, Paper, Divider, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HandymanIcon from '@mui/icons-material/Handyman';
import PublicIcon from '@mui/icons-material/Public';

import { useAuth } from '../../../hooks/useAuth';

export const CivicRightRail = ({ totalReports = 0 }) => {
  const { user, profile, role, isAuthenticated } = useAuth();

  const getRoleLabel = () => {
    if (role === 'ADMIN') return 'Administrator';
    if (role === 'GOVERNMENT_OFFICIAL') return 'Municipal Official';
    return 'Verified Citizen';
  };

  return (
    <Box
      sx={{
        width: 320,
        display: { xs: 'none', lg: 'block' },
        position: 'sticky',
        top: 24,
        alignSelf: 'flex-start',
        pl: 3,
      }}
    >
      {/* User Summary Widget */}
      {isAuthenticated ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            p: 1,
          }}
        >
          <Box
            component={RouterLink}
            to="/profile"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'secondary.main',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="700" noWrap sx={{ maxWidth: 160 }}>
                {profile?.name || 'Citizen'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 160 }}>
                {getRoleLabel()}
              </Typography>
            </Box>
          </Box>

          <Button
            component={RouterLink}
            to="/profile"
            size="small"
            color="primary"
            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
          >
            View
          </Button>
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle2" fontWeight="700" gutterBottom>
            Join Civic Voice
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Report road hazards, vote on local fixes, and track city repairs.
          </Typography>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            color="primary"
            fullWidth
            size="small"
            sx={{ mb: 1 }}
          >
            Sign Up
          </Button>
          <Button
            component={RouterLink}
            to="/login"
            variant="text"
            color="inherit"
            fullWidth
            size="small"
          >
            Log In
          </Button>
        </Paper>
      )}

      {/* Community Civic Stats */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 3,
          mb: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PublicIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight="700">
            Community Civic Radar
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HandymanIcon fontSize="small" sx={{ color: 'warning.main' }} />
              <Typography variant="body2" color="text.secondary">
                Total Tracked Issues
              </Typography>
            </Box>
            <Chip label={totalReports} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary">
                Status Transparency
              </Typography>
            </Box>
            <Typography variant="caption" fontWeight="700" color="success.main">
              100% Audited
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Footer Info */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, fontSize: '0.6875rem' }}>
        About • Help • Transparency • Citizen Charter • Privacy • Terms
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, mt: 1, fontSize: '0.6875rem' }}>
        © 2026 CIVIC VOICE PUBLIC INFRASTRUCTURE
      </Typography>
    </Box>
  );
};
