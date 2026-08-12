import { createTheme } from '@mui/material/styles';

export const statusColors = {
  posted: {
    light: { main: '#475569', bg: '#F1F5F9', text: '#334155' },
    dark: { main: '#94A3B8', bg: '#1E293B', text: '#E2E8F0' },
    label: 'Reported',
  },
  action_taken: {
    light: { main: '#D97706', bg: '#FEF3C7', text: '#92400E' },
    dark: { main: '#FBBF24', bg: '#451A03', text: '#FDE68A' },
    label: 'In Progress',
  },
  fixed: {
    light: { main: '#16A34A', bg: '#DCFCE7', text: '#166534' },
    dark: { main: '#4ADE80', bg: '#064E3B', text: '#BBF7D0' },
    label: 'Resolved',
  },
};

export const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#3B82F6' : '#1E4D8C',
        light: isDark ? '#60A5FA' : '#3B82F6',
        dark: isDark ? '#1D4ED8' : '#153A6B',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#38BDF8' : '#0284C7',
      },
      error: {
        main: isDark ? '#F87171' : '#EF4444',
        light: isDark ? '#FCA5A5' : '#F87171',
        dark: isDark ? '#DC2626' : '#B91C1C',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: isDark ? '#FBBF24' : '#D97706',
        light: isDark ? '#FDE68A' : '#FBBF24',
        dark: isDark ? '#B45309' : '#92400E',
        contrastText: '#FFFFFF',
      },
      info: {
        main: isDark ? '#60A5FA' : '#2563EB',
        light: isDark ? '#93C5FD' : '#60A5FA',
        dark: isDark ? '#1D4ED8' : '#1E40AF',
        contrastText: '#FFFFFF',
      },
      success: {
        main: isDark ? '#4ADE80' : '#16A34A',
        light: isDark ? '#86EFAC' : '#4ADE80',
        dark: isDark ? '#15803D' : '#166534',
        contrastText: '#FFFFFF',
      },
      default: {
        main: isDark ? '#94A3B8' : '#64748B',
        light: isDark ? '#CBD5E1' : '#94A3B8',
        dark: isDark ? '#64748B' : '#334155',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#0F172A' : '#F8FAFC',
        paper: isDark ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F8FAFC' : '#0F172A',
        secondary: isDark ? '#94A3B8' : '#64748B',
      },
      divider: isDark ? '#334155' : '#E2E8F0',
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.01em' },
      h3: { fontWeight: 600, fontSize: '1.25rem' },
      h4: { fontWeight: 600, fontSize: '1.125rem' },
      h5: { fontWeight: 600, fontSize: '1rem' },
      h6: { fontWeight: 600, fontSize: '0.875rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 6,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            color: isDark ? '#F8FAFC' : '#0F172A',
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          },
        },
      },
    },
  });
};
