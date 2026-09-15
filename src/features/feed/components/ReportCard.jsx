import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NearMeIcon from '@mui/icons-material/NearMe';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockIcon from '@mui/icons-material/Lock';

import { useThemeMode } from '../../../app/providers/ThemeModeProvider';
import { useAuth } from '../../../hooks/useAuth';
import { statusColors } from '../../../app/theme/theme';
import { setReportHidden } from '../../reportDetail/api';
import { EditReportDialog } from '../../reportDetail/components/EditReportDialog';
import { DeleteReportConfirmDialog } from '../../reportDetail/components/DeleteReportConfirmDialog';
import { formatDistance } from '../../../lib/geoUtils';
import { getPrivacyDisplay } from '../../../lib/privacyUtils';

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

const categoryFallbackImages = {
  pothole: '/images/pothole.jpg',
  streetlight: '/images/streetlight.jpg',
  traffic_light: '/images/traffic_light.jpg',
  garbage: '/images/garbage.jpg',
  other: '/images/pothole.jpg',
};

export const ReportCard = ({ report, isLiked, onToggleLike, isAuth, onReportUpdated, onReportDeleted }) => {
  const { mode } = useThemeMode();
  const { user, role } = useAuth();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hiding, setHiding] = useState(false);

  const statusConfig = statusColors[report.status] || statusColors.ordered;
  const statusStyle = statusConfig[mode] || statusConfig.light;

  const isOwner = user && report.reporter_id === user.id;
  const isAdmin = role === 'ADMIN';
  const canManage = isOwner || isAdmin;
  const canEditOrDelete = report.status === 'ordered' || isAdmin;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleToggleHide = async () => {
    handleMenuClose();
    setHiding(true);
    try {
      const updated = await setReportHidden(report.report_id, !report.is_hidden);
      if (onReportUpdated) {
        onReportUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to toggle hide:', err);
    } finally {
      setHiding(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          mb: 2.5,
          display: 'flex',
          flexDirection: 'column',
          opacity: report.is_hidden ? 0.85 : 1,
          border: (theme) =>
            report.is_hidden
              ? `1px dashed ${theme.palette.warning.main}`
              : `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          transition: 'border-color 0.15s ease',
          '&:hover': {
            borderColor: (theme) => (report.is_hidden ? theme.palette.warning.main : theme.palette.primary.main),
          },
        }}
      >
        {/* Card Top Header: Citizen Info & Status Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.25,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          {(() => {
            const privacyInfo = getPrivacyDisplay({
              reporterId: report.reporter_id,
              realName: report.users?.name || report.reporter_name,
              anonymousName: report.users?.anonymous_name || report.anonymous_name,
              isPostLocked: Boolean(report.privacy_lock),
              isAccountLocked: Boolean(report.users?.privacy_lock),
              currentUserId: user?.id,
            });

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    bgcolor: privacyInfo.avatarBg || 'secondary.main',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                  }}
                >
                  {privacyInfo.isLocked && !privacyInfo.isAuthor ? (
                    <LockIcon sx={{ fontSize: 16 }} />
                  ) : (
                    privacyInfo.avatarChar
                  )}
                </Avatar>
                <Box>
                  {privacyInfo.showProfileLink ? (
                    <Typography
                      variant="subtitle2"
                      component={RouterLink}
                      to={`/profile/${report.reporter_id || ''}`}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        color: 'text.primary',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                        display: 'block',
                        lineHeight: 1.2,
                      }}
                    >
                      {privacyInfo.displayName}
                    </Typography>
                  ) : (
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        color: 'text.primary',
                        display: 'block',
                        lineHeight: 1.2,
                      }}
                    >
                      🦒 {privacyInfo.displayName}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(report.created_at)}
                    </Typography>
                    {privacyInfo.isLocked && (
                      <Chip
                        label={privacyInfo.isAuthor ? '🔒 You (Anonymous)' : '🔒 Anonymous'}
                        size="small"
                        color={privacyInfo.isAuthor ? 'warning' : 'default'}
                        sx={{ height: 16, fontSize: '0.625rem', fontWeight: 700, ml: 0.25 }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })()}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {report.is_hidden && (
              <Chip
                icon={<VisibilityOffOutlinedIcon fontSize="small" />}
                label="Hidden"
                size="small"
                color="warning"
                sx={{ fontWeight: 600, fontSize: '0.6875rem', height: 22, borderRadius: '4px' }}
              />
            )}
            <Chip
              label={statusConfig.label}
              size="small"
              sx={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                borderRadius: '4px',
                border: `1px solid ${statusStyle.border || statusStyle.main}`,
              }}
            />
            {canManage && (
              <IconButton size="small" onClick={handleMenuOpen} aria-label="Report actions">
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Media Container */}
        <Box sx={{ position: 'relative', width: '100%', bgcolor: 'background.default' }}>
          <CardMedia
            component="img"
            image={report.photo_url || categoryFallbackImages[report.category] || '/images/traffic_light.jpg'}
            alt={report.title}
            loading="lazy"
            onError={(e) => {
              const fallback = categoryFallbackImages[report.category] || '/images/traffic_light.jpg';
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
            sx={{
              width: '100%',
              maxHeight: 400,
              minHeight: 220,
              objectFit: 'cover',
              display: 'block',
              bgcolor: 'background.default',
            }}
          />

          {/* Category Tag pill and Proximity Pill on image */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pointerEvents: 'none',
            }}
          >
            <Chip
              label={categoryLabels[report.category] || report.category}
              size="small"
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.85)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                pointerEvents: 'auto',
              }}
            />

            {report.distance_km != null && (
              <Chip
                icon={<NearMeIcon sx={{ fontSize: '14px !important', color: '#38bdf8 !important' }} />}
                label={formatDistance(report.distance_km)}
                size="small"
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.9)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  pointerEvents: 'auto',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Content Section */}
        <CardContent sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to={`/report/${report.report_id}`}
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 0.75,
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
              mb: 1.5,
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            {report.description}
          </Typography>

          {/* Location Pin & Distance info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', maxWidth: '70%' }}>
              <LocationOnIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
              <Typography
                variant="caption"
                color="text.secondary"
                component="a"
                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                title={report.address ? `${report.address} (GPS: ${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)})` : `GPS: ${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                }}
              >
                {report.address || `GPS: ${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
              </Typography>
            </Box>

            {report.distance_km != null && (
              <Chip
                icon={<NearMeIcon sx={{ fontSize: '13px !important' }} />}
                label={formatDistance(report.distance_km)}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 165, 233, 0.06)',
                }}
              />
            )}
          </Box>
        </CardContent>

        {/* Action Row */}
        <CardActions
          sx={{
            px: 2,
            py: 1,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={isAuth ? (isLiked ? 'Unlike report' : 'Support this report') : 'Sign in to support'}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={() => onToggleLike(report.report_id)}
                  color={isLiked ? 'error' : 'inherit'}
                  disabled={!isAuth}
                  aria-label="Support report"
                >
                  {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                </IconButton>
                <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ ml: 0.25 }}>
                  {report.like_count || 0}
                </Typography>
              </Box>
            </Tooltip>

            <Tooltip title="View comments in report details">
              <Box
                component={RouterLink}
                to={`/report/${report.report_id}#comments`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  ml: 1,
                  borderRadius: '4px',
                  py: 0.25,
                  px: 0.75,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'primary.main',
                  },
                }}
              >
                <IconButton
                  size="small"
                  color="inherit"
                  component="span"
                  aria-label="View comments"
                  sx={{ p: 0.25 }}
                >
                  <ChatBubbleOutlineIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ ml: 0.5 }}>
                  {report.comment_count || 0}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          <Typography
            component={RouterLink}
            to={`/report/${report.report_id}`}
            variant="caption"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            View Details & Timeline →
          </Typography>
        </CardActions>
      </Card>

      {/* Overflow Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Tooltip title={!canEditOrDelete ? "Cannot edit after action has been taken" : ''} placement="left">
          <span>
            <MenuItem
              disabled={!canEditOrDelete}
              onClick={() => {
                handleMenuClose();
                setEditOpen(true);
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          </span>
        </Tooltip>

        <MenuItem onClick={handleToggleHide} disabled={hiding}>
          <ListItemIcon>
            {report.is_hidden ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{report.is_hidden ? 'Unhide from Feed' : 'Hide from Feed'}</ListItemText>
        </MenuItem>

        <Tooltip title={!canEditOrDelete ? "Cannot delete after action has been taken" : ''} placement="left">
          <span>
            <MenuItem
              disabled={!canEditOrDelete}
              onClick={() => {
                handleMenuClose();
                setDeleteOpen(true);
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>

      {/* Edit Dialog */}
      <EditReportDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        report={report}
        onSaveSuccess={(updated) => {
          if (onReportUpdated) onReportUpdated(updated);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteReportConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        reportId={report.report_id}
        onDeleteSuccess={() => {
          if (onReportDeleted) onReportDeleted(report.report_id);
        }}
      />
    </>
  );
};
