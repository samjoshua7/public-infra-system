import React from 'react';
import { Box, Chip } from '@mui/material';
import CommuteIcon from '@mui/icons-material/Commute';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrafficIcon from '@mui/icons-material/Traffic';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AppsIcon from '@mui/icons-material/Apps';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const CATEGORIES = [
  { id: 'all', label: 'All Issues', icon: <AppsIcon sx={{ fontSize: 16 }} /> },
  { id: 'pothole', label: 'Potholes', icon: <CommuteIcon sx={{ fontSize: 16 }} /> },
  { id: 'streetlight', label: 'Streetlights', icon: <LightbulbIcon sx={{ fontSize: 16 }} /> },
  { id: 'traffic_light', label: 'Traffic Lights', icon: <TrafficIcon sx={{ fontSize: 16 }} /> },
  { id: 'garbage', label: 'Garbage', icon: <DeleteSweepIcon sx={{ fontSize: 16 }} /> },
  { id: 'other', label: 'Other', icon: <MoreHorizIcon sx={{ fontSize: 16 }} /> },
];

export const CategoryFilterBar = ({ activeCategory, onSelectCategory }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2,
        overflowX: 'auto',
        pb: 0.5,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = activeCategory === cat.id;
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
              fontSize: '0.8125rem',
              py: 1.75,
              px: 0.5,
              borderRadius: '4px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              bgcolor: isSelected ? 'primary.main' : 'background.paper',
              color: isSelected ? 'primary.contrastText' : 'text.secondary',
              '& .MuiChip-icon': {
                color: isSelected ? 'inherit' : 'text.secondary',
              },
              '&:hover': {
                bgcolor: isSelected
                  ? 'primary.main'
                  : (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                borderColor: isSelected ? 'primary.main' : 'text.secondary',
              },
            }}
          />
        );
      })}
    </Box>
  );
};
