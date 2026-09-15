import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import NearMeIcon from '@mui/icons-material/NearMe';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import RefreshIcon from '@mui/icons-material/Refresh';

const RADIUS_OPTIONS = [
  { value: null, label: 'All Nearby' },
  { value: 2, label: '< 2 km' },
  { value: 5, label: '< 5 km' },
  { value: 10, label: '< 10 km' },
  { value: 25, label: '< 25 km' },
];

export const NearbyLocationBar = ({
  coords,
  hasCoords,
  loadingLocation,
  permissionStatus,
  onRequestLocation,
  selectedRadius,
  onSelectRadius,
}) => {
  return (
    <Box sx={{ mb: 2.5 }}>
      {/* 1. GPS Status Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(248, 250, 252, 0.9)',
          mb: 1.5,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.5,
              bgcolor: hasCoords ? 'primary.main' : 'warning.main',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {hasCoords ? (
              <NearMeIcon sx={{ fontSize: 20 }} />
            ) : (
              <LocationOffIcon sx={{ fontSize: 20 }} />
            )}
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.875rem' }}>
                {hasCoords ? 'Hyper-Local Civic Feed' : 'Community Feed (Location Inactive)'}
              </Typography>
              {hasCoords && (
                <Chip
                  label="Live GPS Active"
                  size="small"
                  color="success"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                />
              )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {hasCoords
                ? `Showing issues prioritized by distance to (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
                : permissionStatus === 'denied'
                ? 'Location permission is blocked in your browser. Showing all community reports.'
                : 'Enable device location to automatically surface issues in your immediate neighborhood.'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ alignSelf: { xs: 'flex-end', sm: 'center' }, flexShrink: 0 }}>
          {hasCoords ? (
            <Tooltip title="Update live GPS position">
              <Button
                size="small"
                variant="outlined"
                onClick={onRequestLocation}
                disabled={loadingLocation}
                startIcon={
                  loadingLocation ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  )
                }
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 1,
                }}
              >
                {loadingLocation ? 'Locating...' : 'Refresh GPS'}
              </Button>
            </Tooltip>
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={onRequestLocation}
              disabled={loadingLocation}
              startIcon={
                loadingLocation ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <MyLocationIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                py: 0.5,
                px: 1.75,
                borderRadius: 1,
              }}
            >
              {loadingLocation ? 'Finding...' : 'Enable Location'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* 2. Radius Filter Chips */}
      {hasCoords && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Typography
            variant="caption"
            fontWeight="700"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', mr: 0.5, flexShrink: 0 }}
          >
            Radius:
          </Typography>

          {RADIUS_OPTIONS.map((opt) => {
            const isSelected = selectedRadius === opt.value;
            return (
              <Chip
                key={opt.label}
                label={opt.label}
                clickable
                size="small"
                onClick={() => onSelectRadius(opt.value)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 1,
                  bgcolor: isSelected ? 'primary.main' : 'background.paper',
                  color: isSelected ? 'primary.contrastText' : 'text.secondary',
                  border: (theme) =>
                    isSelected ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                  },
                }}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};
