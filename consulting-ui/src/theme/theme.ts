import {
  alpha,
  createTheme,
  type PaletteMode,
  type ThemeOptions,
} from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';
import { colors, designTokens } from './colors';
import { fontFamily, typography } from './typography';

const shape = { borderRadius: 8 };
const spacing = 8;

declare module '@mui/material/styles' {
  interface PaletteColor {
    lighter?: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
  }
  interface Palette {
    status: {
      active: { main: string; bg: string };
      pending: { main: string; bg: string };
      pastDue: { main: string; bg: string };
    };
  }
  interface PaletteOptions {
    status?: {
      active?: { main: string; bg: string };
      pending?: { main: string; bg: string };
      pastDue?: { main: string; bg: string };
    };
  }
}

function getPalette(mode: PaletteMode): ThemeOptions['palette'] {
  const modeColors = colors[mode];

  return {
    mode,
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    grey: colors.grey,
    common: {
      black: designTokens.black,
      white: designTokens.textPrimary,
    },
    background: modeColors.background,
    text: modeColors.text,
    divider: modeColors.divider,
    status: {
      active: { main: colors.success.main, bg: colors.success.lighter },
      pending: { main: colors.warning.main, bg: colors.warning.lighter },
      pastDue: { main: colors.error.main, bg: colors.error.lighter },
    },
  };
}

function getComponents(mode: PaletteMode): ThemeOptions['components'] {
  const modeColors = colors[mode];
  const isDark = mode === 'dark';

  return {
  MuiCssBaseline: {
    styleOverrides: {
      ':root': { colorScheme: mode },
      'html, body, #root': {
        minHeight: '100%',
        backgroundColor: modeColors.background.default,
      },
      body: {
        margin: 0,
        color: modeColors.text.primary,
        fontFamily,
        scrollbarWidth: 'thin',
      },
      'button, input, textarea, select': { fontFamily },
      '::selection': {
        color: designTokens.textPrimary,
        backgroundColor: designTokens.primary,
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: 50,
        paddingInline: 18,
      },
      containedPrimary: {
        color: designTokens.textPrimary,
        backgroundColor: designTokens.primary,
        '&:hover': { backgroundColor: colors.primary.dark },
      },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        color: modeColors.text.primary,
        backgroundColor: modeColors.background.paper,
        backgroundImage: 'none',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        border: `1px solid ${modeColors.divider}`,
        borderRadius: 12,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { border: `1px solid ${modeColors.divider}` },
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0, color: 'inherit' },
    styleOverrides: {
      root: {
        boxShadow: 'none',
        borderBottom: `1px solid ${modeColors.divider}`,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { borderRight: `1px solid ${modeColors.divider}` },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 6, fontWeight: 600 },
      colorSuccess: {
        backgroundColor: isDark ? colors.success.lighter : '#dcfce7',
        color: isDark ? colors.success.light : colors.success.dark,
      },
      colorWarning: {
        backgroundColor: isDark ? colors.warning.lighter : '#fef3c7',
        color: isDark ? colors.warning.light : colors.warning.dark,
      },
      colorError: {
        backgroundColor: isDark ? colors.error.lighter : '#fee2e2',
        color: isDark ? colors.error.light : colors.error.dark,
      },
      colorInfo: {
        backgroundColor: isDark ? colors.info.lighter : '#dbeafe',
        color: isDark ? colors.info.light : colors.info.dark,
      },
      colorDefault: {
        backgroundColor: isDark ? colors.grey[800] : colors.grey[200],
        color: isDark ? colors.grey[300] : colors.grey[700],
      },
    },
  },
  MuiTextField: { defaultProps: { size: 'small' } },
  MuiSelect: { defaultProps: { size: 'small' } },
  MuiTableCell: {
    styleOverrides: {
      head: { fontWeight: 700 },
      root: { borderBottomColor: modeColors.divider },
    },
  },
  MuiTooltip: {
    styleOverrides: { tooltip: { fontSize: '0.75rem' } },
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: `1px solid ${modeColors.divider}`,
        borderRadius: 10,
        backgroundColor: modeColors.background.paper,
      },
      columnHeaders: {
        backgroundColor: isDark ? colors.grey[900] : '#f0f0ed',
        borderBottom: `1px solid ${modeColors.divider}`,
      },
      cell: { borderBottom: `1px solid ${modeColors.divider}` },
      row: {
        '&:hover': { backgroundColor: alpha(modeColors.text.primary, 0.05) },
      },
      footerContainer: { borderTop: `1px solid ${modeColors.divider}` },
    },
  },
  };
}

export function buildTheme(mode: PaletteMode) {
  return createTheme({
    palette: getPalette(mode),
    typography,
    shape,
    spacing,
    components: getComponents(mode),
  });
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');
