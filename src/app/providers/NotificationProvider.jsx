import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  Slide,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import BuildIcon from '@mui/icons-material/Build';
import VerifiedIcon from '@mui/icons-material/Verified';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import {
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../features/notifications/api';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showNativePushNotification,
} from '../../lib/nativeNotifications';

export const NotificationContext = createContext({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  nativePermission: 'default',
  requestNativePermission: async () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [nativePermission, setNativePermission] = useState(getNotificationPermission());
  const [toast, setToast] = useState({
    open: false,
    notification: null,
  });

  const requestNativePermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNativePermission(perm);
    return perm;
  }, []);

  // Fetch unread count for current user
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread notifications count:', err);
    }
  }, [isAuthenticated, user?.id]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Set up initial count & Supabase Realtime channel subscription
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();
    setNativePermission(getNotificationPermission());

    // Auto-prompt browser notification permission on each reload if default
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        requestNativePermission();

        // Fallback user interaction listener if browser suppresses non-gesture prompt
        const triggerPromptOnGesture = () => {
          if (Notification.permission === 'default') {
            requestNativePermission();
          }
          window.removeEventListener('click', triggerPromptOnGesture);
          window.removeEventListener('keydown', triggerPromptOnGesture);
          window.removeEventListener('touchstart', triggerPromptOnGesture);
        };

        window.addEventListener('click', triggerPromptOnGesture, { once: true });
        window.addEventListener('keydown', triggerPromptOnGesture, { once: true });
        window.addEventListener('touchstart', triggerPromptOnGesture, { once: true });
      }
    }

    // Subscribe to realtime changes on notifications for this user
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new;
          setUnreadCount((prev) => prev + 1);

          // 1. In-app toast notification
          setToast({
            open: true,
            notification: newNotif,
          });

          // 2. Native OS / Desktop / Mobile Push notification
          showNativePushNotification({
            title: newNotif.title,
            message: newNotif.message,
            subtext: newNotif.subtext,
            reportId: newNotif.report_id,
            type: newNotif.type,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, refreshUnreadCount]);

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleToastAction = () => {
    const notif = toast.notification;
    handleCloseToast();
    if (notif) {
      if (notif.id && !notif.read) {
        markAsRead(notif.id);
      }
      if (notif.report_id) {
        navigate(`/report/${notif.report_id}`);
      } else {
        navigate('/notifications');
      }
    }
  };

  // Icon mapping for in-app alert toast
  const getToastIcon = (type) => {
    switch (type) {
      case 'status_change':
        return <BuildIcon fontSize="small" sx={{ color: '#0284C7' }} />;
      case 'account_approved':
        return <VerifiedIcon fontSize="small" sx={{ color: '#16A34A' }} />;
      case 'new_report':
        return <CampaignIcon fontSize="small" sx={{ color: '#E11D48' }} />;
      default:
        return <NotificationsActiveIcon fontSize="small" sx={{ color: '#2563EB' }} />;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        nativePermission,
        requestNativePermission,
      }}
    >
      {children}

      {/* Global In-App Notification Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          mt: { xs: 7, md: 2 },
          mr: { xs: 1, md: 2 },
          maxWidth: { xs: 'calc(100% - 16px)', sm: 420 },
        }}
      >
        <Alert
          severity="info"
          icon={getToastIcon(toast.notification?.type)}
          onClose={handleCloseToast}
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              alignItems: 'center',
            },
          }}
        >
          <Box sx={{ pr: 1 }}>
            <AlertTitle sx={{ fontSize: '0.875rem', fontWeight: 700, mb: 0.25 }}>
              {toast.notification?.title || 'Notification'}
            </AlertTitle>
            <Typography variant="body2" sx={{ fontSize: '0.8125rem', lineHeight: 1.35, mb: 0.5 }}>
              {toast.notification?.message}
            </Typography>
            {toast.notification?.subtext && (
              <Typography
                variant="caption"
                display="block"
                sx={{
                  fontSize: '0.725rem',
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  mb: 0.75,
                }}
              >
                {toast.notification.subtext}
              </Typography>
            )}
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={handleToastAction}
              sx={{
                fontSize: '0.75rem',
                py: 0.25,
                px: 1.25,
                minHeight: 24,
                borderRadius: 1,
                textTransform: 'none',
              }}
            >
              {toast.notification?.report_id ? 'View Report' : 'View Activity'}
            </Button>
          </Box>
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
