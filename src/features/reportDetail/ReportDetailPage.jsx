import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  Button,
  TextField,
  Avatar,
  IconButton,
  Grid,
  Tooltip,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

import {
  getReportDetail,
  listReportComments,
  addReportComment,
  listStatusHistory,
  setReportHidden,
} from './api';
import { fetchUserLikedReportIds, toggleReportLike } from '../feed/api';
import { EditReportDialog } from './components/EditReportDialog';
import { DeleteReportConfirmDialog } from './components/DeleteReportConfirmDialog';
import { StatusUpdateControl } from '../officialDashboard/components/StatusUpdateControl';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../app/providers/ThemeModeProvider';
import { statusColors } from '../../app/theme/theme';

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

export const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, isAuthenticated } = useAuth();
  const { mode } = useThemeMode();

  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [isLiked, setIsLiked] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Owner/Admin Controls state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hiding, setHiding] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportData, commentsData, historyData] = await Promise.all([
        getReportDetail(id),
        listReportComments(id),
        listStatusHistory(id),
      ]);

      setReport(reportData);
      setComments(commentsData);
      setStatusHistory(historyData);

      if (user?.id) {
        const likedSet = await fetchUserLikedReportIds(user.id);
        setIsLiked(likedSet.has(id));
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
      setError('Could not load report details. The report may not exist or has been removed.');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleLike = async () => {
    if (!isAuthenticated || !user?.id || !report) return;

    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setReport((prev) => ({
      ...prev,
      like_count: nextIsLiked ? prev.like_count + 1 : Math.max(0, prev.like_count - 1),
    }));

    try {
      await toggleReportLike({ reportId: id, userId: user.id, isLiked });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      loadData();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.id) return;

    setPostingComment(true);
    try {
      const createdComment = await addReportComment({
        reportId: id,
        userId: user.id,
        body: newComment.trim(),
      });
      setComments((prev) => [...prev, createdComment]);
      setReport((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }));
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleToggleHide = async () => {
    setMenuAnchor(null);
    setHiding(true);
    try {
      const updated = await setReportHidden(report.report_id, !report.is_hidden);
      setReport((prev) => ({ ...prev, is_hidden: updated.is_hidden }));
    } catch (err) {
      console.error('Failed to toggle hide:', err);
      alert(err.message || 'Failed to toggle hide status');
    } finally {
      setHiding(false);
    }
  };

  if (loading) return <LoadingSkeleton type="detail" />;
  if (error || !report) return <ErrorAlert message={error || 'Report not found'} onRetry={loadData} />;

  const statusConfig = statusColors[report.status] || statusColors.posted;
  const statusStyle = statusConfig[mode] || statusConfig.light;

  const isOwner = user && report.reporter_id === user.id;
  const isAdmin = role === 'ADMIN';
  const canManage = isOwner || isAdmin;
  const canEditOrDelete = report.status === 'posted' || isAdmin;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;

  return (
    <Box sx={{ pb: 6, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          component={RouterLink}
          to="/feed"
          startIcon={<ArrowBackIcon />}
          color="inherit"
        >
          Back to Feed
        </Button>

        {canManage && (
          <Box>
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="manage report">
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Tooltip title={!canEditOrDelete ? "Can't edit after action has been taken" : ''} placement="left">
                <span>
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
                    <ListItemText>Edit Details</ListItemText>
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
                      setMenuAnchor(null);
                      setDeleteOpen(true);
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>Delete Report</ListItemText>
                  </MenuItem>
                </span>
              </Tooltip>
            </Menu>
          </Box>
        )}
      </Box>

      {/* Hidden Banner */}
      {report.is_hidden && (
        <Alert severity="warning" icon={<VisibilityOffOutlinedIcon />} sx={{ mb: 3, fontWeight: 600 }}>
          This report is currently hidden from the public feed. Only you, government officials, and administrators can see it.
        </Alert>
      )}

      {/* Official Status Update Control */}
      <StatusUpdateControl
        reportId={report.report_id}
        currentStatus={report.status}
        onStatusUpdated={loadData}
      />

      {/* Main Report Card */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <Box sx={{ position: 'relative', width: '100%', maxHeight: 450, overflow: 'hidden', bgcolor: 'black' }}>
          <Box
            component="img"
            src={report.photo_url}
            alt={report.title}
            sx={{
              width: '100%',
              maxHeight: 450,
              objectFit: 'contain',
              display: 'block',
              mx: 'auto',
            }}
          />
        </Box>

        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={statusConfig.label}
              sx={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                fontWeight: 700,
                border: `1px solid ${statusStyle.main}`,
              }}
            />
            <Chip
              label={categoryLabels[report.category] || report.category}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              Reported on {formatDate(report.created_at)}
            </Typography>
          </Box>

          <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
            {report.title}
          </Typography>

          <Typography variant="body1" color="text.primary" paragraph sx={{ whiteSpace: 'pre-line', mb: 3 }}>
            {report.description}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Location & Reporter Info */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                  {(report.users?.name || 'C').charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight="600">
                    {report.users?.name || 'Citizen'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reporter
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                }}
              >
                <LocationOnIcon color="action" />
                <Typography variant="body2" color="text.secondary">
                  {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                </Typography>
                <Button
                  component="a"
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  startIcon={<MapIcon />}
                  variant="outlined"
                  sx={{ ml: 1 }}
                >
                  View Map
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Like Action */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={isAuthenticated ? (isLiked ? 'Unlike report' : 'Like report') : 'Log in to like'}>
              <Button
                variant={isLiked ? 'contained' : 'outlined'}
                color={isLiked ? 'error' : 'inherit'}
                startIcon={isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleToggleLike}
                disabled={!isAuthenticated}
              >
                {report.like_count} {report.like_count === 1 ? 'Like' : 'Likes'}
              </Button>
            </Tooltip>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <ChatBubbleOutlineIcon fontSize="small" />
              <Typography variant="body2" fontWeight="600">
                {report.comment_count} Comments
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Status Audit History Timeline */}
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h6" fontWeight="700">
            Status Audit Trail
          </Typography>
        </Box>

        {statusHistory.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No status updates recorded yet.
          </Typography>
        ) : (
          <Box sx={{ pl: 1 }}>
            {statusHistory.map((item, index) => {
              const itemConfig = statusColors[item.status] || statusColors.posted;
              const dotColor =
                item.status === 'fixed' ? 'success.main' : item.status === 'action_taken' ? 'warning.main' : 'grey.500';
              const isLast = index === statusHistory.length - 1;
              return (
                <Box key={item.history_id || index} sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: dotColor,
                        mt: '4px',
                        flexShrink: 0,
                      }}
                    />
                    {!isLast && (
                      <Box sx={{ width: '2px', flexGrow: 1, bgcolor: 'divider', minHeight: 32 }} />
                    )}
                  </Box>
                  <Box sx={{ pb: isLast ? 0 : 3 }}>
                    <Typography variant="subtitle2" fontWeight="700">
                      {itemConfig.label}
                    </Typography>
                    {item.note && (
                      <Typography variant="body2" color="text.secondary">
                        "{item.note}"
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Updated by {item.users?.name || 'System'} • {formatDate(item.created_at)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Comments Section */}
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="700" gutterBottom>
          Community Comments ({comments.length})
        </Typography>

        {/* Comment Input */}
        {isAuthenticated ? (
          <Box component="form" onSubmit={handleAddComment} sx={{ mb: 4, mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Add a community note or comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                endIcon={<SendIcon />}
                disabled={postingComment || !newComment.trim()}
              >
                Post Comment
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please{' '}
            <Button component={RouterLink} to="/login" size="small" variant="text">
              log in
            </Button>{' '}
            to join the community discussion.
          </Typography>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Comments List */}
        {comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
            No comments yet. Be the first to comment on this issue!
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {comments.map((comment) => (
              <Box
                key={comment.comment_id}
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: 'secondary.main' }}>
                    {(comment.users?.name || 'U').charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight="600">
                    {comment.users?.name || 'Citizen'}
                  </Typography>
                  {comment.users?.role === 'GOVERNMENT_OFFICIAL' && (
                    <Chip label="Official" color="warning" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {formatDate(comment.created_at)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', pl: 5 }}>
                  {comment.body}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <EditReportDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        report={report}
        onSaveSuccess={(updated) => {
          setReport((prev) => ({ ...prev, ...updated }));
        }}
      />

      {/* Delete Dialog */}
      <DeleteReportConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        reportId={report.report_id}
        onDeleteSuccess={() => {
          navigate('/feed', { replace: true });
        }}
      />
    </Box>
  );
};
