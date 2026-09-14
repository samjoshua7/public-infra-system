import React from 'react';
import { Box, Container } from '@mui/material';
import { DesktopSidebar } from './DesktopSidebar';
import { AppHeader } from './AppHeader';
import { MobileTopBar } from './MobileTopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { PWAInstallPrompt } from '../pwa/PWAInstallPrompt';

export const AppShell = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        overflowX: 'hidden',
      }}
    >
      {/* 1. Desktop Navigation: Left Sidebar + Desktop Header */}
      <DesktopSidebar />
      <Box sx={{ pl: { xs: 0, md: '240px' } }}>
        <AppHeader />
      </Box>

      {/* 2. Mobile Navigation: Top Bar */}
      <MobileTopBar />

      {/* 3. Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pl: { xs: 0, md: '240px' },
          py: { xs: 2, sm: 3 },
          pb: { xs: '76px', md: 3 }, // Bottom padding on mobile so content clears bottom nav
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
          {children}
        </Container>
      </Box>

      {/* 4. Mobile Navigation: WhatsApp-Style Bottom Bar */}
      <MobileBottomNav />

      {/* 5. PWA Install Prompt Banner */}
      <PWAInstallPrompt />
    </Box>
  );
};
