import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
      dark: '#4338ca',
      light: '#a5b4fc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#14b8a6',
      dark: '#0f766e',
      light: '#5eead4',
      contrastText: '#ffffff',
    },
    success: {
      main: '#22c55e',
      dark: '#15803d',
      light: '#dcfce7',
    },
    warning: {
      main: '#f59e0b',
      dark: '#b45309',
      light: '#fef3c7',
    },
    error: {
      main: '#ef4444',
      dark: '#b91c1c',
      light: '#fee2e2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: 'var(--font-sans)',
    h1: { fontSize: 'var(--text-3xl)', fontWeight: 700 },
    h2: { fontSize: 'var(--text-2xl)', fontWeight: 700 },
    h3: { fontSize: 'var(--text-xl)', fontWeight: 600 },
    body1: { fontSize: 'var(--text-base)' },
    body2: { fontSize: 'var(--text-sm)' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 4,
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-md)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
})
