import { createTheme } from '@mui/material/styles';

export const statusColors = {
  ordered: {
    light: { main: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', text: '#334155', border: '#94A3B8' },
    dark: { main: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)', text: '#E2E8F0', border: '#64748B' },
    label: 'Ordered',
  },
  budget_allocated: {
    light: { main: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', text: '#0369A1', border: '#38BDF8' },
    dark: { main: '#38BDF8', bg: 'rgba(56, 189, 248, 0.18)', text: '#BAE6FD', border: '#0284C7' },
    label: 'Budget Allocated',
  },
  on_process: {
    light: { main: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', text: '#B45309', border: '#FBBF24' },
    dark: { main: '#FBBF24', bg: 'rgba(251, 191, 36, 0.18)', text: '#FEF3C7', border: '#F59E0B' },
    label: 'On Process',
  },
  finished: {
    light: { main: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', text: '#065F46', border: '#34D399' },
    dark: { main: '#34D399', bg: 'rgba(52, 211, 153, 0.18)', text: '#D1FAE5', border: '#10B981' },
    label: 'Finished',
  },
};

export const categoryColors = {
  pothole: {
    color: '#FF6B6B',
  },
  streetlight: {
    color: '#A855F7',
  },
  traffic_light: {
    color: '#00C6FF',
  },
  garbage: {
    color: '#F857A6',
  },
  other: {
    color: '#4E65FF',
  },
};

export const storyGradients = {
  active: '#7C3AED',
  pothole: '#FF6B6B',
  streetlight: '#A855F7',
  traffic: '#10B981',
  garbage: '#F857A6',
  resolved: '#0095F6',
  seen: '#94A3B8',
};

export const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#0095F6',
        light: '#38BDF8',
        dark: '#0072FF',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#EC4899',
      },
      error: {
        main: '#FF2A54',
        light: '#FF7680',
        dark: '#C13584',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#F59E0B',
        light: '#FCD34D',
        dark: '#B45309',
        contrastText: '#FFFFFF',
      },
      info: {
        main: '#00C6FF',
        light: '#67E8F9',
        dark: '#0284C7',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#0A0E17' : '#F8F7FF',
        paper: isDark ? '#121212' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F5F5F5' : '#262626',
        secondary: isDark ? '#A8A8A8' : '#737373',
      },
      divider: isDark ? '#262626' : '#DBDBDB',
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
      h1: { fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, fontSize: '1.375rem', letterSpacing: '-0.01em' },
      h3: { fontWeight: 700, fontSize: '1.125rem' },
      h4: { fontWeight: 700, fontSize: '1rem' },
      h5: { fontWeight: 600, fontSize: '0.875rem' },
      h6: { fontWeight: 600, fontSize: '0.8125rem' },
      body1: { fontSize: '0.875rem', lineHeight: 1.5 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.45 },
      caption: { fontSize: '0.75rem', lineHeight: 1.35 },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            boxShadow: 'none',
            fontWeight: 700,
            padding: '6px 18px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: 'none',
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            backgroundColor: '#0095F6',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#0077CC',
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: isDark ? '#121212' : '#FFFFFF',
            border: isDark ? '1px solid #262626' : '1px solid #DBDBDB',
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.6)'
              : '0 4px 16px rgba(0, 0, 0, 0.04)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 20,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(255, 255, 255, 0.92)',
            color: isDark ? '#F5F5F5' : '#262626',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
            borderBottom: isDark ? '1px solid #262626' : '1px solid #DBDBDB',
          },
        },
      },
    },
  });
};
