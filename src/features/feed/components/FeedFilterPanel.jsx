import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import NearMeIcon from '@mui/icons-material/NearMe';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import CommuteIcon from '@mui/icons-material/Commute';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrafficIcon from '@mui/icons-material/Traffic';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AppsIcon from '@mui/icons-material/Apps';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TuneIcon from '@mui/icons-material/Tune';

import { STATUS_ORDER, STATUS_LABELS } from '../../../lib/reportStatus';

const CATEGORIES = [
  { id: 'all', label: 'All Issues', icon: <AppsIcon sx={{ fontSize: 15 }} /> },
  { id: 'pothole', label: 'Potholes', icon: <CommuteIcon sx={{ fontSize: 15 }} /> },
  { id: 'streetlight', label: 'Streetlights', icon: <LightbulbIcon sx={{ fontSize: 15 }} /> },
  { id: 'traffic_light', label: 'Traffic Lights', icon: <TrafficIcon sx={{ fontSize: 15 }} /> },
  { id: 'garbage', label: 'Garbage', icon: <DeleteSweepIcon sx={{ fontSize: 15 }} /> },
  { id: 'other', label: 'Other', icon: <MoreHorizIcon sx={{ fontSize: 15 }} /> },
];

const RADIUS_OPTIONS = [
  { value: null, label: 'All Nearby' },
  { value: 2, label: '< 2 km' },
  { value: 5, label: '< 5 km' },
  { value: 10, label: '< 10 km' },
  { value: 25, label: '< 25 km' },
];

export const FeedFilterPanel = ({
  coords,
  hasCoords,
  loadingLocation,
  permissionStatus,
  onRequestLocation,
  selectedRadius,
  onSelectRadius,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  onResetFilters,
  totalCount,
  isMobile = false,
  onClose,
}) => {
  const isFiltered =
    selectedRadius !== null ||
    (selectedCategory && selectedCategory !== 'all') ||
    (selectedStatus && selectedStatus !== 'all');

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* 1. Header with Active Filter Count & Reset */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.875rem' }}>
            Filter Feed
          </Typography>
          {isFiltered && (
            <Chip
              label="Active"
              size="small"
              color="primary"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isFiltered && (
            <Button
              size="small"
              startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
              onClick={onResetFilters}
              sx={{
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                py: 0.25,
                px: 1,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              Reset
            </Button>
          )}

          {isMobile && onClose && (
            <IconButton size="small" onClick={onClose} aria-label="Close filters">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Divider />

      {/* 2. Compact GPS Status Card */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(241, 245, 249, 0.7)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {hasCoords ? (
              <NearMeIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <LocationOffIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            )}
            <Typography variant="caption" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {hasCoords ? 'Live GPS Active' : 'Location Inactive'}
            </Typography>
          </Box>

          <Tooltip title={hasCoords ? 'Refresh current GPS position' : 'Enable device location'}>
            <IconButton
              size="small"
              onClick={onRequestLocation}
              disabled={loadingLocation}
              sx={{ p: 0.5 }}
            >
              {loadingLocation ? (
                <CircularProgress size={14} color="inherit" />
              ) : hasCoords ? (
                <RefreshIcon sx={{ fontSize: 15 }} />
              ) : (
                <MyLocationIcon sx={{ fontSize: 15, color: 'primary.main' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem', lineHeight: 1.3 }}>
          {hasCoords
            ? `Pin: ${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°`
            : permissionStatus === 'denied'
            ? 'Permission blocked in browser settings'
            : 'Click to surface nearby complaints'}
        </Typography>
      </Box>

      {/* 3. Proximity Radius Section */}
      <Box>
        <Typography
          variant="caption"
          fontWeight="700"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}
        >
          Proximity Radius
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
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
                  bgcolor: isSelected ? 'primary.main' : 'background.default',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                  border: (theme) =>
                    isSelected ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* 4. Category Section */}
      <Box>
        <Typography
          variant="caption"
          fontWeight="700"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}
        >
          Category
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Chip
                key={cat.id}
                icon={cat.icon}
                label={cat.label}
                clickable
                size="small"
                onClick={() => onSelectCategory(cat.id)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 1,
                  bgcolor: isSelected ? 'primary.main' : 'background.default',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                  border: (theme) =>
                    isSelected ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                  '& .MuiChip-icon': {
                    color: isSelected ? 'inherit' : 'text.secondary',
                  },
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* 5. Status Pipeline Section */}
      <Box>
        <Typography
          variant="caption"
          fontWeight="700"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}
        >
          Status
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          <Chip
            label="All Statuses"
            clickable
            size="small"
            onClick={() => onSelectStatus('all')}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              borderRadius: 1,
              bgcolor: selectedStatus === 'all' ? 'primary.main' : 'background.default',
              color: selectedStatus === 'all' ? 'primary.contrastText' : 'text.primary',
              border: (theme) =>
                selectedStatus === 'all' ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
            }}
          />
          {STATUS_ORDER.map((st) => {
            const isSelected = selectedStatus === st;
            return (
              <Chip
                key={st}
                label={STATUS_LABELS[st]}
                clickable
                size="small"
                onClick={() => onSelectStatus(st === selectedStatus ? 'all' : st)}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: 1,
                  bgcolor: isSelected ? 'primary.main' : 'background.default',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                  border: (theme) =>
                    isSelected ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* 6. Footer Count */}
      <Box sx={{ pt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {totalCount} total verified reports
        </Typography>
      </Box>
    </Paper>
  );
};
