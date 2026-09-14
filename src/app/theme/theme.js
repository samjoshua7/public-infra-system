import { createTheme } from '@mui/material/styles';

export const statusColors = {
  ordered: {
    light: { main: '#475569', bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' },
    dark: { main: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', text: '#E2E8F0', border: '#475569' },
    label: 'Ordered',
  },
  budget_allocated: {
    light: { main: '#0369A1', bg: '#F0F9FF', text: '#0C4A6E', border: '#BAE6FD' },
    dark: { main: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', text: '#BAE6FD', border: '#0369A1' },
    label: 'Budget Allocated',
  },
  on_process: {
    light: { main: '#B45309', bg: '#FEF3C7', text: '#78350F', border: '#FDE68A' },
    dark: { main: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)', text: '#FEF3C7', border: '#92400E' },
    label: 'On Process',
  },
  finished: {
    light: { main: '#15803D', bg: '#ECFDF5', text: '#064E3B', border: '#A7F3D0' },
    dark: { main: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', text: '#D1FAE5', border: '#065F46' },
    label: 'Finished',
  },
};

export const categoryColors = {
  pothole: { color: '#DC2626' },
  streetlight: { color: '#D97706' },
  traffic_light: { color: '#0F172A' },
  garbage: { color: '#15803D' },
  other: { color: '#64748B' },
};

export const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#F8FAFC' : '#0F172A',
        light: isDark ? '#FFFFFF' : '#1E293B',
        dark: isDark ? '#E2E8F0' : '#020617',
        contrastText: isDark ? '#0F172A' : '#FFFFFF',
      },
      secondary: {
        main: '#64748B',
        light: '#94A3B8',
        dark: '#475569',
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#DC2626',
        light: '#EF4444',
        dark: '#B91C1C',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#D97706',
        light: '#F59E0B',
        dark: '#B45309',
        contrastText: '#FFFFFF',
      },
      info: {
        main: '#0284C7',
        light: '#38BDF8',
        dark: '#0369A1',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#15803D',
        light: '#22C55E',
        dark: '#166534',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#090D14' : '#F8FAFC',
        paper: isDark ? '#111827' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F9FAFB' : '#0F172A',
        secondary: isDark ? '#9CA3AF' : '#64748B',
      },
      divider: isDark ? '#1F2937' : '#E2E8F0',
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
      h1: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', lineHeight: 1.25 },
      h2: { fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.01em', lineHeight: 1.3 },
      h3: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.35 },
      h4: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
      h5: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.45 },
      h6: { fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 },
      body1: { fontSize: '0.875rem', lineHeight: 1.55 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', lineHeight: 1.4 },
      button: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 4,
            boxShadow: 'none',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.8125rem',
            padding: '6px 14px',
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            backgroundColor: isDark ? '#F8FAFC' : '#0F172A',
            color: isDark ? '#0F172A' : '#FFFFFF',
            '&:hover': {
              backgroundColor: isDark ? '#E2E8F0' : '#1E293B',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: isDark ? '#334155' : '#E2E8F0',
            color: isDark ? '#F8FAFC' : '#0F172A',
            '&:hover': {
              borderColor: isDark ? '#475569' : '#CBD5E1',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
            },
          },
          sizeSmall: {
            padding: '4px 10px',
            fontSize: '0.75rem',
          },
          sizeLarge: {
            padding: '8px 18px',
            fontSize: '0.875rem',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            border: isDark ? '1px solid #1F2937' : '1px solid #E2E8F0',
            boxShadow: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 4,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 4,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 6,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            color: isDark ? '#F9FAFB' : '#0F172A',
            boxShadow: 'none',
            borderBottom: isDark ? '1px solid #1F2937' : '1px solid #E2E8F0',
          },
        },
      },
    },
  });
};
