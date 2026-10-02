/**
 * Core design-system tokens for the application's high-contrast dark theme.
 * Components should consume these through the MUI palette wherever possible.
 */
export const designTokens = {
  primary: '#FF6500',
  black: '#000000',
  appBackground: '#0a0a0a',
  surface: '#121212',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  border: 'rgba(255, 255, 255, 0.05)',
  lightAppBackground: '#f5f5f2',
  lightSurface: '#fafaf8',
  lightTextPrimary: '#1a1a1a',
  lightTextSecondary: '#5f5f5f',
  lightBorder: 'rgba(0, 0, 0, 0.08)',
} as const;

const grey = {
  50: '#ffffff',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a0a0a0',
  500: '#737373',
  600: '#525252',
  700: '#333333',
  800: '#1f1f1f',
  900: '#121212',
  950: '#0a0a0a',
} as const;

export const colors = {
  primary: {
    lighter: '#3d1800',
    light: '#ff8533',
    main: designTokens.primary,
    dark: '#cc5100',
    contrastText: designTokens.textPrimary,
  },
  secondary: {
    lighter: grey[800],
    light: grey[300],
    main: designTokens.textSecondary,
    dark: grey[500],
    contrastText: designTokens.black,
  },
  success: {
    lighter: '#052e16',
    light: '#4ade80',
    main: '#22c55e',
    dark: '#16a34a',
    contrastText: designTokens.black,
  },
  warning: {
    lighter: '#422006',
    light: '#fbbf24',
    main: '#f59e0b',
    dark: '#d97706',
    contrastText: designTokens.black,
  },
  error: {
    lighter: '#450a0a',
    light: '#f87171',
    main: '#ef4444',
    dark: '#dc2626',
    contrastText: designTokens.textPrimary,
  },
  info: {
    lighter: '#172554',
    light: '#60a5fa',
    main: '#3b82f6',
    dark: '#2563eb',
    contrastText: designTokens.textPrimary,
  },
  grey,
  light: {
    background: {
      default: designTokens.lightAppBackground,
      paper: designTokens.lightSurface,
    },
    text: {
      primary: designTokens.lightTextPrimary,
      secondary: designTokens.lightTextSecondary,
      disabled: grey[400],
    },
    divider: designTokens.lightBorder,
  },
  dark: {
    background: {
      default: designTokens.appBackground,
      paper: designTokens.surface,
    },
    text: {
      primary: designTokens.textPrimary,
      secondary: designTokens.textSecondary,
      disabled: grey[600],
    },
    divider: designTokens.border,
  },
} as const;
