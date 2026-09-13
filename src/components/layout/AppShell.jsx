import React from 'react';
import { Box, Container } from '@mui/material';
import { AppHeader } from './AppHeader';

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
      <AppHeader />

      <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, sm: 3 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};
