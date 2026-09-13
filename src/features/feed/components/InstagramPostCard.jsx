import React, { useState, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { useThemeMode } from '../../../app/providers/ThemeModeProvider';
import { useAuth } from '../../../hooks/useAuth';
import { statusColors, categoryColors } from '../../../app/theme/theme';
import { setReportHidden, addReportComment } from '../../reportDetail/api';
import { EditReportDialog } from '../../reportDetail/components/EditReportDialog';
import { DeleteReportConfirmDialog } from '../../reportDetail/components/DeleteReportConfirmDialog';
import { CommentsSheet } from '../../reportDetail/components/CommentsSheet';

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

export const InstagramPostCard = ({
  report,
  isLiked,
  onToggleLike,
  isAuth,
  onReportUpdated,
  onReportDeleted,
}) => {
  const { mode } = useThemeMode();
  const { user, role } = useAuth();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Double-tap heart burst state
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef(0);

  // Inline comment input state
  const [quickComment, setQuickComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
      if (!isLiked && isAuth) {
        onToggleLike(report.report_id);
      }
    }
    lastTapRef.current = now;
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/report/${report.report_id}`;
    navigator.clipboard.writeText(url);
    setToastMessage('Link copied to clipboard!');
    setMenuAnchor(null);
  };

  const handleToggleBookmark = () => {
    setSaved(!saved);
    setToastMessage(saved ? 'Removed from saved reports' : 'Saved to your profile');
  };

  const handleQuickCommentSubmit = async (e) => {
    e?.preventDefault();
    if (!quickComment.trim() || submittingComment || !isAuth) return;

    setSubmittingComment(true);
    try {
      await addReportComment({
        reportId: report.report_id,
        userId: user?.id,
        body: quickComment.trim(),
      });
      setQuickComment('');
      if (onReportUpdated) {
        onReportUpdated({
          ...report,
          comment_count: (report.comment_count || 0) + 1,
        });
      }
      setToastMessage('Comment posted!');
    } catch (err) {
      console.error('Failed to post inline comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleHide = async () => {
    setMenuAnchor(null);
    try {
      const updated = await setReportHidden(report.report_id, !report.is_hidden);
      if (onReportUpdated) onReportUpdated(updated);
      setToastMessage(report.is_hidden ? 'Report unhidden' : 'Report hidden from feed');
    } catch (err) {
      console.error('Failed to toggle hide:', err);
    }
  };

  return (
    <>
      <Card
        sx={{
          mb: 2.5,
          borderRadius: { xs: 0, sm: 3 },
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Post Header */}
        <CardHeader
          avatar={
            <Box
              component={RouterLink}
              to={`/profile/${report.reporter_id || ''}`}
              sx={{
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'secondary.main',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  border: (theme) => `2px solid ${theme.palette.background.paper}`,
                }}
              >
                {(report.users?.name || 'Citizen').charAt(0).toUpperCase()}
              </Avatar>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
              {/* Civic Status Chip with glowing indicator */}
              <Chip
                icon={
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: statusStyle.main,
                      boxShadow: `0 0 8px ${statusStyle.main}`,
                      ml: 1,
                    }}
                  />
                }
                label={statusConfig.label}
                size="small"
                sx={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                  fontWeight: 800,
                  fontSize: '0.6875rem',
                  height: 24,
                  border: `1px solid ${statusStyle.border || statusStyle.main}`,
                  boxShadow: `0 0 10px ${statusStyle.glow || 'transparent'}`,
                }}
              />
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="More options">
                <MoreHorizIcon />
              </IconButton>
            </Box>
          }
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle2"
                component={RouterLink}
                to={`/profile/${report.reporter_id || ''}`}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'text.primary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {report.users?.name || 'Citizen'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                • {formatDate(report.created_at)}
              </Typography>
            </Box>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' },
                }}
                component="a"
                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
              </Typography>
            </Box>
          }
          sx={{ py: 1.5, px: 2 }}
        />

        {/* Media Container with Double Tap Heart Burst */}
        <Box
          onClick={handleDoubleTap}
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            bgcolor: mode === 'dark' ? '#0A0A0A' : '#F0F0F0',
            cursor: 'pointer',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          <CardMedia
            component="img"
            image={report.photo_url}
            alt={report.title}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />

          {/* Hidden Indicator */}
          {report.is_hidden && (
            <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
              <Chip
                label="Hidden from public feed"
                size="small"
                color="warning"
                sx={{ fontWeight: 700, fontSize: '0.75rem' }}
              />
            </Box>
          )}

          {/* Category Tag pill with Solid Signature Color */}
          <Box sx={{ position: 'absolute', bottom: 12, left: 12 }}>
            <Chip
              label={`#${categoryLabels[report.category] || report.category}`}
              size="small"
              sx={{
                bgcolor: categoryColors[report.category]?.color || 'primary.main',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: 'none',
              }}
            />
          </Box>

          {/* Double Tap Heart Burst Animation */}
          {showHeartBurst && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'heartBurst 0.9s ease forwards',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                '@keyframes heartBurst': {
                  '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
                  '40%': { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1 },
                  '70%': { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 0.9 },
                  '100%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 },
                },
              }}
            >
              <FavoriteIcon
                sx={{
                  fontSize: 100,
                  color: '#FF2A54',
                  filter: 'drop-shadow(0 4px 20px rgba(255, 42, 84, 0.8))',
                }}
              />
            </Box>
          )}
        </Box>

        {/* Action Row */}
        <CardActions
          disableSpacing
          sx={{
            px: 1.5,
            pt: 1.25,
            pb: 0.5,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              onClick={() => onToggleLike(report.report_id)}
              disabled={!isAuth}
              aria-label="Like report"
              sx={{
                transition: 'transform 0.15s ease',
                '&:active': { transform: 'scale(1.3)' },
              }}
            >
              {isLiked ? (
                <FavoriteIcon
                  sx={{
                    color: '#FF2A54',
                    filter: 'drop-shadow(0 2px 8px rgba(255, 42, 84, 0.65))',
                  }}
                />
              ) : (
                <FavoriteBorderIcon sx={{ color: 'text.primary' }} />
              )}
            </IconButton>

            <IconButton
              onClick={() => setCommentsSheetOpen(true)}
              color="inherit"
              aria-label="View comments"
            >
              <ChatBubbleOutlineIcon />
            </IconButton>

            <IconButton onClick={handleCopyLink} color="inherit" aria-label="Share report">
              <SendOutlinedIcon />
            </IconButton>
          </Box>

          <IconButton onClick={handleToggleBookmark} color="inherit" aria-label="Bookmark report">
            {saved ? (
              <BookmarkIcon
                sx={{
                  color: '#00C6FF',
                  filter: 'drop-shadow(0 2px 8px rgba(0, 198, 255, 0.5))',
                }}
              />
            ) : (
              <BookmarkBorderIcon />
            )}
          </IconButton>
        </CardActions>

        {/* Post Content & Captions */}
        <CardContent sx={{ px: 2, pt: 0.5, pb: 1.5 }}>
          {/* Likes count */}
          <Typography variant="body2" fontWeight="700" sx={{ mb: 0.75 }}>
            {report.like_count || 0} {report.like_count === 1 ? 'citizen supported' : 'citizens supported'}
          </Typography>

          {/* Title & Description */}
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <Box component="span" fontWeight="700" sx={{ mr: 1 }}>
              {report.users?.name || 'Citizen'}
            </Box>
            <Box component="span" fontWeight="600">
              {report.title}
            </Box>
            {' — '}
            {report.description}
          </Typography>

          {/* View Comments trigger */}
          {(report.comment_count > 0 || isAuth) && (
            <Typography
              variant="caption"
              color="text.secondary"
              onClick={() => setCommentsSheetOpen(true)}
              sx={{
                display: 'block',
                cursor: 'pointer',
                mt: 0.75,
                fontWeight: 500,
                '&:hover': { color: 'text.primary' },
              }}
            >
              {report.comment_count > 0
                ? `View all ${report.comment_count} comments`
                : 'Add the first comment...'}
            </Typography>
          )}

          {/* Inline Quick Comment Input (Desktop) */}
          {isAuth && (
            <Box
              component="form"
              onSubmit={handleQuickCommentSubmit}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                mt: 1.5,
                pt: 1,
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <TextField
                variant="standard"
                placeholder="Add a comment..."
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                InputProps={{ disableUnderline: true }}
                fullWidth
                sx={{ fontSize: '0.8125rem' }}
              />
              <Button
                type="submit"
                disabled={!quickComment.trim() || submittingComment}
                color="primary"
                size="small"
                sx={{ fontWeight: 700, p: 0, minWidth: 'auto' }}
              >
                Post
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Overflow Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            },
          },
        }}
      >
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>

        <MenuItem
          component={RouterLink}
          to={`/report/${report.report_id}`}
          onClick={() => setMenuAnchor(null)}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Go to Post</ListItemText>
        </MenuItem>

        {canManage && (
          <MenuItem
            disabled={!canEditOrDelete}
            onClick={() => {
              setMenuAnchor(null);
              setEditOpen(true);
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}

        {canManage && (
          <MenuItem onClick={handleToggleHide}>
            <ListItemIcon>
              {report.is_hidden ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{report.is_hidden ? 'Unhide' : 'Hide'}</ListItemText>
          </MenuItem>
        )}

        {canManage && (
          <MenuItem
            disabled={!canEditOrDelete}
            onClick={() => {
              setMenuAnchor(null);
              setDeleteOpen(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Interactive Comments Drawer */}
      <CommentsSheet
        open={commentsSheetOpen}
        onClose={() => setCommentsSheetOpen(false)}
        report={report}
        onCommentAdded={() => {
          if (onReportUpdated) {
            onReportUpdated({
              ...report,
              comment_count: (report.comment_count || 0) + 1,
            });
          }
        }}
      />

      {/* Edit Dialog */}
      <EditReportDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        report={report}
        onSaveSuccess={(updated) => {
          if (onReportUpdated) onReportUpdated(updated);
          setToastMessage('Report updated successfully');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteReportConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        reportId={report.report_id}
        onDeleteSuccess={() => {
          if (onReportDeleted) onReportDeleted(report.report_id);
          setToastMessage('Report deleted');
        }}
      />

      {/* Toast Feedback */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="info"
          variant="filled"
          sx={{ borderRadius: 3, fontWeight: 600 }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
