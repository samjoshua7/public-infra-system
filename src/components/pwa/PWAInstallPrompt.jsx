import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import IosShareIcon from '@mui/icons-material/IosShare';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallPrompt = () => {
  const { showPrompt, isIOS, promptInstall, dismissPrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!showPrompt) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await promptInstall();
    } catch (err) {
      console.error('Install prompt error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Slide direction="up" in={showPrompt} mountOnEnter unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: { xs: '68px', md: '24px' }, // Clears 56px WhatsApp bottom nav on mobile
          left: { xs: '12px', md: 'auto' },
          right: { xs: '12px', md: '24px' },
          maxWidth: { xs: 'calc(100vw - 24px)', sm: '420px' },
          zIndex: 1300,
          p: 2,
          borderRadius: '6px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 10px 28px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Header row with Icon, Title, and Close */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Civic Voice Logo"
            sx={{
              width: 44,
              height: 44,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
              bgcolor: 'background.paper',
              objectFit: 'cover',
            }}
          />

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.92rem',
                lineHeight: 1.2,
                color: 'text.primary',
              }}
            >
              Install Civic Voice
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'block',
                mt: 0.25,
                fontSize: '0.75rem',
                lineHeight: 1.3,
              }}
            >
              Fast photo reporting right from your home screen.
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={dismissPrompt}
            aria-label="Dismiss install prompt"
            sx={{
              p: 0.5,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Content & Actions */}
        {isIOS ? (
          /* iOS Safari Step-by-Step Guidance */
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                mb: 1,
                fontSize: '0.78rem',
              }}
            >
              Install this web app on your iPhone or iPad:
            </Typography>

            <Box
              sx={{
                p: 1.25,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  fontSize: '0.75rem',
                  color: 'text.primary',
                }}
              >
                <strong>1.</strong> Tap the <strong>Share</strong> button{' '}
                <IosShareIcon sx={{ fontSize: 16, color: 'text.primary' }} /> in Safari
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  fontSize: '0.75rem',
                  color: 'text.primary',
                }}
              >
                <strong>2.</strong> Select{' '}
                <strong>Add to Home Screen</strong>{' '}
                <AddBoxOutlinedIcon sx={{ fontSize: 16, color: 'text.primary' }} />
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={dismissPrompt}
                sx={{
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  py: 0.5,
                  px: 2,
                  borderColor: 'divider',
                  color: 'text.primary',
                }}
              >
                Got it
              </Button>
            </Box>
          </Box>
        ) : (
          /* Android / Desktop Install Trigger */
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 1.5,
                fontSize: '0.72rem',
                color: 'text.secondary',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <span>Instant launch</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <span>Camera ready</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <span>No app store</span>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={dismissPrompt}
                sx={{
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                Not now
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<GetAppIcon sx={{ fontSize: 18 }} />}
                onClick={handleInstallClick}
                disabled={isInstalling}
                sx={{
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  py: 0.6,
                  px: 2,
                  '&:hover': {
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark' ? '#FFFFFF' : '#020617',
                  },
                }}
              >
                {isInstalling ? 'Installing...' : 'Install App'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Slide>
  );
};
