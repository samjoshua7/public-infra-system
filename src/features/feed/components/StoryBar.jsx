import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import CommuteIcon from '@mui/icons-material/Commute';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrafficIcon from '@mui/icons-material/Traffic';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AppsIcon from '@mui/icons-material/Apps';

import { useAuth } from '../../../hooks/useAuth';

export const StoryBar = ({ activeCategory, onSelectCategory, activeStatus, onSelectStatus }) => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const stories = [
    {
      id: 'report_new',
      label: 'Report Issue',
      isAction: true,
      icon: <AddIcon sx={{ fontSize: 24, color: '#FFFFFF' }} />,
      solidColor: '#0095F6',
      action: () => navigate('/report/new'),
      visible: isAuthenticated && role !== 'GOVERNMENT_OFFICIAL',
    },
    {
      id: 'all',
      label: 'All Issues',
      category: 'all',
      icon: <AppsIcon sx={{ fontSize: 22 }} />,
      solidColor: '#0095F6',
      isActive: activeCategory === 'all' && activeStatus === 'all',
    },
    {
      id: 'pothole',
      label: 'Potholes',
      category: 'pothole',
      icon: <CommuteIcon sx={{ fontSize: 22, color: '#FF6B6B' }} />,
      solidColor: '#FF6B6B',
      isActive: activeCategory === 'pothole',
    },
    {
      id: 'streetlight',
      label: 'Streetlights',
      category: 'streetlight',
      icon: <LightbulbIcon sx={{ fontSize: 22, color: '#A855F7' }} />,
      solidColor: '#A855F7',
      isActive: activeCategory === 'streetlight',
    },
    {
      id: 'traffic_light',
      label: 'Traffic Lights',
      category: 'traffic_light',
      icon: <TrafficIcon sx={{ fontSize: 22, color: '#10B981' }} />,
      solidColor: '#10B981',
      isActive: activeCategory === 'traffic_light',
    },
    {
      id: 'garbage',
      label: 'Garbage',
      category: 'garbage',
      icon: <DeleteSweepIcon sx={{ fontSize: 22, color: '#F43F5E' }} />,
      solidColor: '#F43F5E',
      isActive: activeCategory === 'garbage',
    },
    {
      id: 'finished',
      label: 'Resolved',
      status: 'finished',
      icon: <CheckCircleIcon sx={{ fontSize: 22, color: '#0095F6' }} />,
      solidColor: '#0095F6',
      isActive: activeStatus === 'finished',
    },
  ];

  return (
    <Box
      sx={{
        py: 2,
        px: 1,
        mb: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        overflowX: 'auto',
        display: 'flex',
        gap: { xs: 2, sm: 3 },
        alignItems: 'center',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {stories
        .filter((s) => s.visible !== false)
        .map((story) => (
          <Box
            key={story.id}
            onClick={
              story.isAction
                ? story.action
                : story.category
                ? () => onSelectCategory(story.category)
                : () => onSelectStatus(story.status)
            }
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.15s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            {/* Story Ring */}
            <Box
              sx={{
                p: '2px',
                borderRadius: '50%',
                bgcolor: story.isActive ? story.solidColor : 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                sx={{
                  width: 58,
                  height: 58,
                  bgcolor: 'background.paper',
                  color: story.isActive ? 'primary.main' : 'text.primary',
                  border: (theme) => `2.5px solid ${theme.palette.background.paper}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {story.icon}
              </Avatar>
            </Box>

            <Typography
              variant="caption"
              noWrap
              sx={{
                maxWidth: 72,
                textAlign: 'center',
                fontWeight: story.isActive ? 800 : 600,
                color: story.isActive ? 'text.primary' : 'text.secondary',
                fontSize: '0.75rem',
              }}
            >
              {story.label}
            </Typography>
          </Box>
        ))}
    </Box>
  );
};
