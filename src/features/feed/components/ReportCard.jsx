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
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

import { useThemeMode } from '../../../app/providers/ThemeModeProvider';
import { useAuth } from '../../../hooks/useAuth';
import { statusColors } from '../../../app/theme/theme';
import { setReportHidden } from '../../reportDetail/api';
import { EditReportDialog } from '../../reportDetail/components/EditReportDialog';
import { DeleteReportConfirmDialog } from '../../reportDetail/components/DeleteReportConfirmDialog';

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

export const ReportCard = ({ report, isLiked, onToggleLike, isAuth, onReportUpdated, onReportDeleted }) => {
  const { mode } = useThemeMode();
  const { user, role } = useAuth();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hiding, setHiding] = useState(false);

  const statusConfig = statusColors[report.status] || statusColors.posted;
  const statusStyle = statusConfig[mode] || statusConfig.light;

  const isOwner = user && report.reporter_id === user.id;
  const isAdmin = role === 'ADMIN';
  const canManage = isOwner || isAdmin;

  const canEditOrDelete = report.status === 'posted' || isAdmin;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          opacity: report.is_hidden ? 0.85 : 1,
          border: report.is_hidden ? '1px dashed' : undefined,
          borderColor: report.is_hidden ? 'warning.main' : undefined,
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

          {/* Top Left: Hidden Badge */}
          {report.is_hidden && (
            <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
              <Chip
                icon={<VisibilityOffOutlinedIcon fontSize="small" />}
                label="Hidden — only visible to you"
                size="small"
                color="warning"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          )}

          {/* Top Right: Status Chip & Owner Menu */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              alignItems: 'center',
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
            {canManage && (
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
                }}
                aria-label="report management menu"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
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

      {/* Overflow Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Tooltip title={!canEditOrDelete ? "Can't edit after action has been taken" : ''} placement="left">
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

        <Tooltip title={!canEditOrDelete ? "Can't delete after action has been taken" : ''} placement="left">
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
