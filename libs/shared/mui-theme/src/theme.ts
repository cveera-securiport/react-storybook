import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    primary: {
      main: 'var(--color-primary-500)',
      dark: 'var(--color-primary-700)',
      light: 'var(--color-primary-300)',
      contrastText: 'var(--color-white)',
    },
    secondary: {
      main: 'var(--color-secondary-500)',
      dark: 'var(--color-secondary-700)',
      light: 'var(--color-secondary-300)',
      contrastText: 'var(--color-white)',
    },
    success: {
      main: 'var(--color-success-500)',
      dark: 'var(--color-success-700)',
      light: 'var(--color-success-100)',
    },
    warning: {
      main: 'var(--color-warning-500)',
      dark: 'var(--color-warning-700)',
      light: 'var(--color-warning-100)',
    },
    error: {
      main: 'var(--color-danger-500)',
      dark: 'var(--color-danger-700)',
      light: 'var(--color-danger-100)',
    },
    background: {
      default: 'var(--color-neutral-50)',
      paper: 'var(--color-white)',
    },
    text: {
      primary: 'var(--color-neutral-900)',
      secondary: 'var(--color-neutral-600)',
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
