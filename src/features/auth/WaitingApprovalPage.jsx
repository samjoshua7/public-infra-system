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
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { getAppSettings } from '../settings/api';
import { signOut } from './api';

export const WaitingApprovalPage = () => {
  const { user, profile, approvalStatus, signOut: authSignOut } = useAuth();
  const navigate = useNavigate();

  const [whatsappNumber, setWhatsappNumber] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [noWhatsappAlert, setNoWhatsappAlert] = useState(false);

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
    const defaultText = encodeURIComponent('Hey, I want to use CivicSpeak!');
    const waUrl = `https://wa.me/${cleanNumber}?text=${defaultText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

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
          borderRadius: 3,
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
            ? 'Your account access request was not approved by an administrator. CivicSpeak is currently operating with controlled access.'
            : 'Your account is waiting for approval. CivicSpeak is currently operating with controlled access. Please contact the administrator to request access.'}
        </Typography>

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
