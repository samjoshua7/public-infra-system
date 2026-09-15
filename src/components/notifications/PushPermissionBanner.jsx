import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Collapse,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';

export const PushPermissionBanner = () => {
  const { isAuthenticated } = useAuth();
  const { nativePermission, requestNativePermission } = useNotifications();

  // Reset on each reload: no localStorage persistence so user is asked on every reload
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Auto trigger native permission prompt when banner mounts
  React.useEffect(() => {
    if (isAuthenticated && nativePermission === 'default') {
      requestNativePermission();
    }
  }, [isAuthenticated, nativePermission, requestNativePermission]);

  // Only show if logged in and permission is still default
  if (!isAuthenticated || nativePermission !== 'default' || dismissed) {
    return null;
  }

  const handleAccept = async () => {
    setRequesting(true);
    try {
      await requestNativePermission();
    } catch (err) {
      console.error('Error enabling push notifications:', err);
    } finally {
      setRequesting(false);
    }
  };

  const handleReject = () => {
    // Dismiss for this session only; next reload will prompt again
    setDismissed(true);
  };

  return (
    <Collapse in={!dismissed}>
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 1.75, sm: 2 },
          borderRadius: 2,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.06)',
          border: (theme) => `1px solid ${theme.palette.primary.main}30`,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <NotificationsActiveIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.875rem' }}>
              Enable Desktop & Mobile Push Notifications
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
              Receive instant system notifications on Windows and Android whenever reports are submitted or updated.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleAccept}
            disabled={requesting}
            sx={{
              fontSize: '0.75rem',
              py: 0.6,
              px: 2,
              borderRadius: 1,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
            }}
          >
            {requesting ? 'Prompting...' : 'Accept'}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={handleReject}
            sx={{
              fontSize: '0.75rem',
              py: 0.6,
              px: 1.5,
              borderRadius: 1,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Reject
          </Button>
        </Box>
      </Paper>
    </Collapse>
  );
};
