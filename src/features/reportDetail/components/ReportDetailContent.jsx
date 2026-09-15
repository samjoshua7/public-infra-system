import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputBase,
  CircularProgress,
  Collapse,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';

import {
  getReportDetail,
  listReportComments,
  addReportComment,
  listStatusHistory,
  setReportHidden,
} from '../api';
import { fetchUserLikedReportIds, toggleReportLike } from '../../feed/api';
import { EditReportDialog } from './EditReportDialog';
import { DeleteReportConfirmDialog } from './DeleteReportConfirmDialog';
import { StatusUpdateControl } from '../../officialDashboard/components/StatusUpdateControl';
import { LoadingSkeleton } from '../../../components/feedback/LoadingSkeleton';
import { ErrorAlert } from '../../../components/feedback/ErrorAlert';
import { useAuth } from '../../../hooks/useAuth';
import { useThemeMode } from '../../../app/providers/ThemeModeProvider';
import { statusColors } from '../../../app/theme/theme';
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

export const ReportDetailContent = ({
  reportId,
  showBackToFeed = false,
  onClose = null,
  onStatusUpdated = null,
  onDeleteSuccess = null,
}) => {
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

  // Toggle for audit trail collapse on right panel
  const [auditOpen, setAuditOpen] = useState(false);

  // Owner/Admin Controls state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hiding, setHiding] = useState(false);

  const commentInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);

    try {
      const [reportData, commentsData, historyData] = await Promise.all([
        getReportDetail(reportId),
        listReportComments(reportId),
        listStatusHistory(reportId),
      ]);

      setReport(reportData);
      setComments(commentsData || []);
      setStatusHistory(historyData || []);

      if (user?.id) {
        const likedIds = await fetchUserLikedReportIds(user.id);
        const hasLiked =
          likedIds instanceof Set
            ? likedIds.has(reportId)
            : Array.isArray(likedIds)
            ? likedIds.includes(reportId)
            : false;
        setIsLiked(hasLiked);
      }
    } catch (err) {
      console.error('Failed to load report detail:', err);
      setError(err.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  }, [reportId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleLike = async () => {
    if (!isAuthenticated || !user?.id || !report) return;

    const previousLiked = isLiked;
    const nextLiked = !previousLiked;
    setIsLiked(nextLiked);
    setReport((prev) => ({
      ...prev,
      like_count: Math.max(0, (prev.like_count || 0) + (nextLiked ? 1 : -1)),
    }));

    try {
      await toggleReportLike({
        reportId: report.report_id,
        userId: user.id,
        isLiked: previousLiked,
      });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      setIsLiked(previousLiked);
      setReport((prev) => ({
        ...prev,
        like_count: Math.max(0, (prev.like_count || 0) + (previousLiked ? 1 : -1)),
      }));
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!isAuthenticated || !user?.id || !newComment.trim() || postingComment) return;

    const commentText = newComment.trim();
    setPostingComment(true);

    try {
      const inserted = await addReportComment(report.report_id, user.id, commentText);
      setComments((prev) => [...prev, inserted]);
      setReport((prev) => ({ ...prev, comment_count: (prev.comment_count || 0) + 1 }));
      setNewComment('');

      // Auto scroll comments to bottom
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(err.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleStatusUpdateCallback = () => {
    loadData();
    if (onStatusUpdated) {
      onStatusUpdated();
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

  const statusConfig = statusColors[report.status] || statusColors.ordered;
  const statusStyle = statusConfig[mode] || statusConfig.light;

  const isOwner = user && report.reporter_id === user.id;
  const isAdmin = role === 'ADMIN';
  const isOfficial = role === 'GOVERNMENT_OFFICIAL';
  const canManage = isOwner || isAdmin;
  const canEditOrDelete = report.status === 'ordered' || isAdmin;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
    if (diffSec < 172800) return '1d';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;

  const mainContent = (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: { xs: 'auto', md: '100%' },
        maxHeight: { md: '100%' },
        borderRadius: { xs: 0, sm: 2 },
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
      }}
    >
      {/* ========================================================================= */}
      {/* LEFT COLUMN: INSTAGRAM-STYLE PHOTO FRAME (CONTAIN FIT, BLACK LETTERBOX)   */}
      {/* ========================================================================= */}
      <Box
        sx={{
          flex: { xs: 'none', md: '1 1 58%' },
          minWidth: 0,
          bgcolor: '#080C14',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          height: { xs: 320, sm: 420, md: '100%' },
        }}
      >
        <Box
          component="img"
          src={report.photo_url || categoryFallbackImages[report.category] || '/images/traffic_light.jpg'}
          alt={report.title}
          onError={(e) => {
            const fallback = categoryFallbackImages[report.category] || '/images/traffic_light.jpg';
            if (e.currentTarget.src !== fallback) {
              e.currentTarget.src = fallback;
            }
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />

        {/* Floating Badges Over Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            left: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 2,
          }}
        >
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              fontWeight: 700,
              fontSize: '0.75rem',
              border: `1px solid ${statusStyle.border || statusStyle.main}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          />
          <Chip
            label={categoryLabels[report.category] || report.category}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.65)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.75rem',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
        </Box>

        {/* Hidden Report Watermark Badge */}
        {report.is_hidden && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 14,
              left: 14,
              bgcolor: 'rgba(234, 88, 12, 0.9)',
              color: '#FFFFFF',
              px: 1.25,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              zIndex: 2,
            }}
          >
            <VisibilityOffIcon sx={{ fontSize: 14 }} />
            Hidden from Feed
          </Box>
        )}

        {/* Mobile-only close button on image */}
        {onClose && (
          <IconButton
            onClick={onClose}
            aria-label="close"
            sx={{
              display: { xs: 'flex', md: 'none' },
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: '#FFFFFF',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
              zIndex: 3,
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: INSTAGRAM 3-ZONE LAYOUT (HEADER, SCROLLABLE BODY, FOOTER)  */}
      {/* ========================================================================= */}
      <Box
        sx={{
          flex: { xs: 'none', md: '1 1 42%' },
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 'auto', md: '100%' },
          maxHeight: { md: '100%' },
          borderLeft: (theme) => ({ md: `1px solid ${theme.palette.divider}` }),
          bgcolor: 'background.paper',
        }}
      >
        {/* ----------------------------------------------------------------------- */}
        {/* 1. TOP STICKY HEADER (REPORTER, ACTIONS, MODAL CLOSE)                   */}
        {/* ----------------------------------------------------------------------- */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          {/* Reporter Profile */}
          {(() => {
            const privacyInfo = getPrivacyDisplay({
              reporterId: report.reporter_id,
              realName: report.users?.name,
              anonymousName: report.users?.anonymous_name || report.anonymous_name,
              isPostLocked: Boolean(report.privacy_lock),
              isAccountLocked: Boolean(report.users?.privacy_lock),
              currentUserId: user?.id,
            });

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: privacyInfo.avatarBg || 'primary.main',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {privacyInfo.isLocked && !privacyInfo.isAuthor ? (
                    <LockIcon sx={{ fontSize: 18 }} />
                  ) : (
                    privacyInfo.avatarChar
                  )}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="700"
                      noWrap
                      sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}
                    >
                      {privacyInfo.isLocked && !privacyInfo.isAuthor ? `🦒 ${privacyInfo.displayName}` : privacyInfo.displayName}
                    </Typography>
                    {privacyInfo.isLocked && (
                      <Chip
                        icon={<LockIcon sx={{ fontSize: '11px !important' }} />}
                        label={privacyInfo.isAuthor ? '🔒 Visible only to you' : '🔒 Anonymous'}
                        size="small"
                        color={privacyInfo.isAuthor ? 'warning' : 'default'}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    )}
                    {report.users?.role === 'GOVERNMENT_OFFICIAL' && (
                      <Chip
                        icon={<VerifiedUserIcon sx={{ fontSize: '12px !important' }} />}
                        label="Official"
                        size="small"
                        color="info"
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.725rem' }}>
                    {privacyInfo.isAuthor && privacyInfo.isLocked
                      ? `Hidden as 🦒 ${privacyInfo.dummyName} to others • ${formatRelativeTime(report.created_at)}`
                      : `Reporter • ${formatRelativeTime(report.created_at)}`}
                  </Typography>
                </Box>
              </Box>
            );
          })()}

          {/* Right Action Icons: Options & Close */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {canManage && (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  aria-label="manage report"
                  sx={{ color: 'text.secondary' }}
                >
                  <MoreVertIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Tooltip title={!canEditOrDelete ? "Can't edit after action taken" : ''} placement="left">
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

                  <Tooltip title={!canEditOrDelete ? "Can't delete after action taken" : ''} placement="left">
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
              </>
            )}

            {onClose && (
              <IconButton
                size="small"
                onClick={onClose}
                aria-label="close modal"
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* ----------------------------------------------------------------------- */}
        {/* 2. MIDDLE SCROLLABLE ZONE: DETAILS, AUDIT TRAIL, COMMENTS               */}
        {/* ----------------------------------------------------------------------- */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: { xs: 'none', md: 'calc(100% - 190px)' },
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
              borderRadius: '4px',
            },
          }}
        >
          {/* Post Title & Description */}
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1rem', lineHeight: 1.35, mb: 1 }}>
              {report.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                whiteSpace: 'pre-line',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                color: 'text.secondary',
              }}
            >
              {report.description}
            </Typography>

            {/* Geolocation Tag & Address */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0.75,
                mt: 1.5,
                px: 1.25,
                py: 0.6,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <LocationOnIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" fontWeight="600" color="text.primary">
                {report.address || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
              </Typography>
              {report.address && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                  ({report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)})
                </Typography>
              )}
              <Button
                component="a"
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                startIcon={<MapIcon sx={{ fontSize: '13px !important' }} />}
                sx={{
                  ml: 0.5,
                  p: 0,
                  minWidth: 0,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                Maps
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Official Status Pipeline Control (Only visible to Officials & Admins) */}
          {(isOfficial || isAdmin) && (
            <Box sx={{ mb: 1 }}>
              <StatusUpdateControl
                reportId={report.report_id}
                currentStatus={report.status}
                onStatusUpdated={handleStatusUpdateCallback}
              />
            </Box>
          )}

          {/* Status Audit History (Collapsible Accordion / Timeline) */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              onClick={() => setAuditOpen((prev) => !prev)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.8125rem' }}>
                  Status Audit Trail ({statusHistory.length})
                </Typography>
              </Box>
              {auditOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>

            <Collapse in={auditOpen}>
              <Box sx={{ mt: 1.5, pl: 0.5 }}>
                {statusHistory.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No status transitions recorded yet.
                  </Typography>
                ) : (
                  statusHistory.map((item, idx) => {
                    const itemConfig = statusColors[item.status] || statusColors.ordered;
                    const isLast = idx === statusHistory.length - 1;
                    return (
                      <Box key={item.history_id || idx} sx={{ display: 'flex', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              mt: 0.75,
                              flexShrink: 0,
                            }}
                          />
                          {!isLast && (
                            <Box sx={{ width: '2px', flexGrow: 1, bgcolor: 'divider', minHeight: 20 }} />
                          )}
                        </Box>
                        <Box sx={{ pb: isLast ? 0 : 1.5 }}>
                          <Typography variant="caption" fontWeight="700" display="block">
                            {itemConfig.label}
                          </Typography>
                          {item.note && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ fontStyle: 'italic', my: 0.25 }}
                            >
                              "{item.note}"
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.675rem' }}>
                            {item.users?.name || 'Official'} • {formatRelativeTime(item.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Collapse>
          </Box>

          <Divider />

          {/* Community Comments Stream */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.8125rem' }}>
              Comments ({comments.length})
            </Typography>

            {comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 28, opacity: 0.35, mb: 0.5 }} />
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  No comments yet.
                </Typography>
                <Typography variant="caption">Be the first to join the civic discussion.</Typography>
              </Box>
            ) : (
              comments.map((comment) => (
                <Box
                  key={comment.comment_id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.25,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: 'secondary.main',
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    {(comment.users?.name || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.8125rem', mr: 0.5 }}>
                        {comment.users?.name || 'Citizen'}
                      </Typography>
                      {comment.users?.role === 'GOVERNMENT_OFFICIAL' && (
                        <Chip
                          label="Official"
                          size="small"
                          color="warning"
                          sx={{ height: 16, fontSize: '0.625rem', fontWeight: 700, mr: 0.5 }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8125rem',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                          display: 'inline',
                        }}
                      >
                        {comment.body}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.675rem', display: 'block', mt: 0.25 }}
                    >
                      {formatRelativeTime(comment.created_at)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
            <div ref={commentsEndRef} />
          </Box>
        </Box>

        {/* ----------------------------------------------------------------------- */}
        {/* 3. DOCKED FOOTER: INSTAGRAM ACTION ICONS, COUNTS & DOCKED COMMENT BAR   */}
        {/* ----------------------------------------------------------------------- */}
        <Box
          sx={{
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          {/* Action Icons Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={isAuthenticated ? (isLiked ? 'Unlike' : 'Like') : 'Log in to like'}>
                <IconButton
                  size="small"
                  onClick={handleToggleLike}
                  disabled={!isAuthenticated}
                  aria-label="like report"
                  sx={{
                    color: isLiked ? '#E11D48' : 'text.primary',
                    transition: 'transform 0.15s ease',
                    '&:active': { transform: 'scale(1.2)' },
                  }}
                >
                  {isLiked ? (
                    <FavoriteIcon sx={{ fontSize: 24, color: '#E11D48' }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 24 }} />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Comment">
                <IconButton
                  size="small"
                  onClick={() => commentInputRef.current?.focus()}
                  aria-label="comment"
                  sx={{ color: 'text.primary' }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="View location on map">
                <IconButton
                  component="a"
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  aria-label="open map"
                  sx={{ color: 'text.primary' }}
                >
                  <LocationOnIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Likes and Date Label */}
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.8125rem' }}>
              {report.like_count || 0} {report.like_count === 1 ? 'like' : 'likes'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
            >
              {formatDate(report.created_at)}
            </Typography>
          </Box>

          {/* Docked Comment Input Bar (Instagram style) */}
          <Box
            component="form"
            onSubmit={handleAddComment}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              px: 2,
              py: 0.75,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFAFA'),
            }}
          >
            {isAuthenticated ? (
              <>
                <InputBase
                  inputRef={commentInputRef}
                  fullWidth
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(e);
                    }
                  }}
                  disabled={postingComment}
                  sx={{
                    fontSize: '0.8125rem',
                    pr: 1,
                  }}
                />
                <Button
                  type="submit"
                  size="small"
                  disabled={postingComment || !newComment.trim()}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    textTransform: 'none',
                    minWidth: 44,
                    p: 0.5,
                    color: 'primary.main',
                    '&.Mui-disabled': {
                      color: 'text.disabled',
                    },
                  }}
                >
                  {postingComment ? <CircularProgress size={16} /> : 'Post'}
                </Button>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ py: 0.5 }}>
                <Button component={RouterLink} to="/login" size="small" sx={{ p: 0, minWidth: 0, fontWeight: 700 }}>
                  Log in
                </Button>{' '}
                to like or comment on this report.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

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
          if (onDeleteSuccess) {
            onDeleteSuccess();
          } else {
            navigate('/feed', { replace: true });
          }
        }}
      />
    </Paper>
  );

  if (showBackToFeed) {
    return (
      <Box sx={{ maxWidth: 1080, mx: 'auto', py: { xs: 1, sm: 2 } }}>
        <Box sx={{ mb: 2 }}>
          <Button component={RouterLink} to="/feed" startIcon={<ArrowBackIcon />} color="inherit" size="small">
            Back to Feed
          </Button>
        </Box>
        <Box sx={{ height: { xs: 'auto', md: '78vh' }, minHeight: { md: 560 } }}>
          {mainContent}
        </Box>
      </Box>
    );
  }

  return mainContent;
};
