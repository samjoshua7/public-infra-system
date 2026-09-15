import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BlockIcon from '@mui/icons-material/Block';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { getAppSettings } from '../settings/api';
import { signOut } from './api';
import { supabase } from '../../lib/supabaseClient';

export const WaitingApprovalPage = () => {
  const { user, profile, approvalStatus, isApproved, isAuthenticated, role, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [whatsappNumber, setWhatsappNumber] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [noWhatsappAlert, setNoWhatsappAlert] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const getDestination = () => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'GOVERNMENT_OFFICIAL') return '/dashboard';
    return '/feed';
  };

  // 1. Redirect if already approved or unauthenticated
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (isApproved) {
        const timer = setTimeout(() => {
          navigate(getDestination(), { replace: true });
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, isAuthenticated, isApproved, role, navigate]);

  // 2. Realtime listener on public.users table for current user's approval status
  useEffect(() => {
    if (!user?.id || isApproved) return;

    const channel = supabase
      .channel(`public:users:approval:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        async () => {
          await refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isApproved, refreshProfile]);

  // 3. Fallback polling interval every 4 seconds in case Realtime publication is not configured
  useEffect(() => {
    if (!user?.id || isApproved) return;

    const interval = setInterval(async () => {
      await refreshProfile();
    }, 4000);

    return () => clearInterval(interval);
  }, [user?.id, isApproved, refreshProfile]);

  // 4. Load app settings for WhatsApp permission request
  useEffect(() => {
    getAppSettings()
      .then((settings) => {
        if (settings?.whatsapp_number) {
          setWhatsappNumber(settings.whatsapp_number);
        }
      })
      .catch((err) => console.error('Failed to load app settings:', err))
      .finally(() => setSettingsLoading(false));
  }, []);

  const handleAskPermission = () => {
    if (!whatsappNumber) {
      setNoWhatsappAlert(true);
      return;
    }

    // Clean phone number (remove +, spaces, dashes)
    const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
    const defaultText = encodeURIComponent('Hey, I want to use Civic Voice!');
    const waUrl = `https://wa.me/${cleanNumber}?text=${defaultText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setStatusMessage(null);
    try {
      const updated = await refreshProfile();
      const status = updated?.approval_status || approvalStatus;
      if (status === 'approved') {
        setStatusMessage({ type: 'success', text: 'Approval confirmed! Redirecting...' });
      } else if (status === 'rejected') {
        setStatusMessage({ type: 'error', text: 'Your account access request was not approved.' });
      } else {
        setStatusMessage({ type: 'info', text: 'Account is still pending approval. Please contact the administrator.' });
      }
    } catch (err) {
      console.error('Failed to check approval status:', err);
      setStatusMessage({ type: 'error', text: 'Could not reach server to verify status. Please try again.' });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  // Prevent flash while initial authentication is loading
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={36} />
      </Box>
    );
  }

  // If approved, show clean success card while redirecting
  if (isApproved) {
    return (
      <Box
        sx={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 4,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 5 },
            maxWidth: 520,
            width: '100%',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2.5,
              bgcolor: 'success.main',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 36 }} />
          </Avatar>

          <Typography variant="h5" component="h1" fontWeight="700" gutterBottom color="success.main">
            Account Approved!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your account has been approved. Redirecting to Civic Voice...
          </Typography>

          <CircularProgress size={28} color="success" />
        </Paper>
      </Box>
    );
  }

  const isRejected = approvalStatus === 'rejected';

  return (
    <Box
      sx={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 520,
          width: '100%',
          borderRadius: '6px',
          textAlign: 'center',
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2.5,
            bgcolor: isRejected ? 'error.main' : 'warning.main',
          }}
        >
          {isRejected ? <BlockIcon sx={{ fontSize: 36 }} /> : <HourglassEmptyIcon sx={{ fontSize: 36 }} />}
        </Avatar>

        <Typography variant="h5" component="h1" fontWeight="700" gutterBottom>
          {isRejected ? 'Account Access Rejected' : 'Waiting for Approval'}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
          {isRejected
            ? 'Your account access request was not approved by an administrator. Civic Voice is currently operating with controlled access.'
            : 'Your account is waiting for approval. Civic Voice is currently operating with controlled access. Please contact the administrator to request access.'}
        </Typography>

        {statusMessage && (
          <Alert severity={statusMessage.type} sx={{ mb: 3, textAlign: 'left' }}>
            {statusMessage.text}
          </Alert>
        )}

        {noWhatsappAlert && (
          <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
            No administrator WhatsApp number has been configured yet. Please try again later or contact support.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={settingsLoading ? <CircularProgress size={20} color="inherit" /> : <WhatsAppIcon />}
            onClick={handleAskPermission}
            disabled={settingsLoading}
            sx={{ fontWeight: 700, py: 1.2 }}
          >
            Ask Permission via WhatsApp
          </Button>

          <Button
            variant="outlined"
            color="primary"
            size="medium"
            startIcon={checkingStatus ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            sx={{ fontWeight: 600 }}
          >
            {checkingStatus ? 'Checking Status...' : 'Check Approval Status'}
          </Button>

          <Button
            variant="text"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 4 }}>
          Logged in as {user?.email} ({profile?.name || 'Citizen'})
        </Typography>
      </Paper>
    </Box>
  );
};
