import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Paper,
  CardMedia,
  Skeleton,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import CampaignIcon from '@mui/icons-material/Campaign';
import VerifiedIcon from '@mui/icons-material/Verified';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import {
  listNotifications,
  deleteNotification,
} from './api';
import { ReportDetailDialog } from '../officialDashboard/components/ReportDetailDialog';
import { PushPermissionBanner } from '../../components/notifications/PushPermissionBanner';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const {
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount,
    nativePermission,
    requestNativePermission,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const fetchNotifications = useCallback(
    async (tabType, pageNum = 1, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const { notifications: items, totalPages } = await listNotifications({
          page: pageNum,
          pageSize: 20,
          type: tabType,
        });

        if (append) {
          setNotifications((prev) => [...prev, ...items]);
        } else {
          setNotifications(items);
        }
        setHasMore(pageNum < totalPages);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    fetchNotifications(activeTab, 1, false);
  }, [activeTab, fetchNotifications, user]);

  const handleTabChange = (event, newTab) => {
    setActiveTab(newTab);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(activeTab, nextPage, true);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.report_id) {
      setSelectedReportId(notif.report_id);
    }
  };

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getNotificationVisuals = (notif) => {
    switch (notif.type) {
      case 'status_change': {
        const isFinished = notif.message.toLowerCase().includes('finished');
        return {
          icon: <BuildIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />,
          iconBg: isFinished ? '#059669' : '#0284C7',
          subtextColor: '#0284C7',
        };
      }
      case 'account_approved':
        return {
          icon: <VerifiedIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />,
          iconBg: '#16A34A',
          subtextColor: '#16A34A',
        };
      case 'new_report':
        return {
          icon: <CampaignIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />,
          iconBg: '#2563EB',
          subtextColor: '#2563EB',
        };
      default:
        return {
          icon: <NotificationsNoneIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />,
          iconBg: '#64748B',
          subtextColor: 'text.secondary',
        };
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: { xs: 1.5, sm: 3 } }}>
      {/* Header with Title and Mark-All-Read Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Typography variant="h6" fontWeight="700">
            Civic Activity & Updates
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              size="small"
              color="error"
              sx={{ fontWeight: 700, fontSize: '0.75rem', height: 20 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* OS Push Notification Status / Action */}
          {nativePermission === 'granted' ? (
            <Chip
              icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
              label="OS Alerts: Active"
              size="small"
              variant="outlined"
              color="success"
              sx={{ height: 24, fontSize: '0.725rem', fontWeight: 600 }}
            />
          ) : nativePermission === 'default' ? (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<NotificationsActiveIcon sx={{ fontSize: 14 }} />}
              onClick={requestNativePermission}
              sx={{
                height: 24,
                fontSize: '0.725rem',
                textTransform: 'none',
                fontWeight: 600,
                px: 1,
              }}
            >
              Enable OS Alerts
            </Button>
          ) : nativePermission === 'denied' ? (
            <Tooltip title="OS push notifications are blocked in your browser site settings.">
              <Chip
                label="OS Alerts: Blocked"
                size="small"
                variant="outlined"
                color="warning"
                sx={{ height: 24, fontSize: '0.725rem' }}
              />
            </Tooltip>
          ) : null}

          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
              onClick={handleMarkAllRead}
              sx={{
                fontSize: '0.75rem',
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>
      </Box>

      {/* Permission Request Banner */}
      <PushPermissionBanner />

      {/* Filter Tabs */}
      <Paper
        variant="outlined"
        sx={{
          mb: 2.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              py: 0.75,
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
            },
          }}
        >
          <Tab label="All" value="all" />
          <Tab label="Status Updates" value="status_change" />
          <Tab label="New Reports" value="new_report" />
          <Tab label="Account" value="account_approved" />
        </Tabs>
      </Paper>

      {/* Main Notification Stream */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : notifications.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            bgcolor: 'background.paper',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <NotificationsNoneIcon sx={{ fontSize: 44, mb: 1, opacity: 0.35 }} />
          <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
            {activeTab === 'all'
              ? 'No notifications yet'
              : `No ${activeTab.replace('_', ' ')} notifications`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Community reports, status updates on posts you like, and official alerts will appear here.
          </Typography>
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {notifications.map((notif) => {
            const visuals = getNotificationVisuals(notif);
            const photoUrl = notif.issue_reports?.photo_url;

            return (
              <Box
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  p: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  bgcolor: (theme) =>
                    !notif.read
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(37, 99, 235, 0.08)'
                        : 'rgba(37, 99, 235, 0.04)'
                      : 'transparent',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.02)',
                  },
                }}
              >
                {/* Unread Accent Bar / Dot */}
                {!notif.read && (
                  <FiberManualRecordIcon
                    sx={{
                      position: 'absolute',
                      left: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 8,
                      color: 'primary.main',
                    }}
                  />
                )}

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, flexGrow: 1, pr: 1.5 }}>
                  {/* Event Icon Badge */}
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: visuals.iconBg,
                      flexShrink: 0,
                      mt: 0.25,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}
                  >
                    {visuals.icon}
                  </Avatar>

                  {/* Body Content */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: notif.read ? 600 : 700,
                          lineHeight: 1.3,
                          color: 'text.primary',
                        }}
                      >
                        {notif.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem', flexShrink: 0, ml: 1 }}
                      >
                        {formatRelativeTime(notif.created_at)}
                      </Typography>
                    </Box>

                    {/* Main Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.4,
                        color: 'text.secondary',
                        mb: 0.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {notif.message}
                    </Typography>

                    {/* Specific Subtext: "The post you liked got updated" / "Your reported issue was updated" */}
                    {notif.subtext && (
                      <Typography
                        variant="caption"
                        display="inline-block"
                        sx={{
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          color: visuals.subtextColor,
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.04)',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 1,
                        }}
                      >
                        {notif.subtext}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Right Area: Thumbnail and Dismiss Action */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  {photoUrl && (
                    <CardMedia
                      component="img"
                      image={photoUrl}
                      alt="thumbnail"
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 1.5,
                        objectFit: 'cover',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    />
                  )}

                  <Tooltip title="Dismiss">
                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(e, notif.id)}
                      sx={{
                        opacity: 0.6,
                        p: 0.5,
                        '&:hover': { opacity: 1, color: 'error.main' },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Paper>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleLoadMore}
            disabled={loadingMore}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8125rem',
              px: 3,
            }}
          >
            {loadingMore ? 'Loading more...' : 'Load older updates'}
          </Button>
        </Box>
      )}

      {/* Detail Dialog */}
      <ReportDetailDialog
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </Container>
  );
};
