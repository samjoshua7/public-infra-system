import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';


import { useThemeMode } from '../../../app/providers/ThemeModeProvider';
import { statusColors } from '../../../app/theme/theme';

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

export const ReportCard = ({ report, isLiked, onToggleLike, isAuth }) => {
  const { mode } = useThemeMode();

  const statusConfig = statusColors[report.status] || statusColors.posted;
  const statusStyle = statusConfig[mode] || statusConfig.light;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 16px rgba(0, 0, 0, 0.4)'
              : '0 8px 16px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="180"
          image={report.photo_url}
          alt={report.title}
          sx={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 1,
          }}
        >
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              fontWeight: 700,
              border: `1px solid ${statusStyle.main}`,
            }}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
          }}
        >
          <Chip
            label={categoryLabels[report.category] || report.category}
            size="small"
            color="primary"
            variant="filled"
            sx={{ opacity: 0.95, fontWeight: 600 }}
          />
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 2, pb: 1 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to={`/report/${report.report_id}`}
          sx={{
            textDecoration: 'none',
            color: 'text.primary',
            fontWeight: 700,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1,
            '&:hover': { color: 'primary.main' },
          }}
        >
          {report.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2,
          }}
        >
          {report.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <LocationOnIcon fontSize="inherit" color="action" />
          <Typography variant="caption" color="text.secondary" noWrap>
            {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions
        sx={{
          px: 2,
          py: 1.5,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          By {report.users?.name || 'Citizen'} • {formatDate(report.created_at)}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isAuth ? (isLiked ? 'Unlike' : 'Like') : 'Log in to like'}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => onToggleLike(report.report_id)}
                color={isLiked ? 'error' : 'inherit'}
                disabled={!isAuth}
                aria-label="like report"
              >
                {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
              </IconButton>
              <Typography variant="caption" fontWeight="600" color="text.secondary">
                {report.like_count || 0}
              </Typography>
            </Box>
          </Tooltip>

          <Box
            component={RouterLink}
            to={`/report/${report.report_id}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'text.secondary',
              gap: 0.5,
            }}
          >
            <IconButton size="small" color="inherit" component="span" aria-label="comments">
              <ChatBubbleOutlineIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" fontWeight="600">
              {report.comment_count || 0}
            </Typography>
          </Box>
        </Box>
      </CardActions>
    </Card>
  );
};
