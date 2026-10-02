import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider, type PaletteMode } from '@mui/material';
import { buildTheme } from '@/theme/theme';
import { readStorage, writeStorage } from '@/utils/storage';
import { ThemeModeContext } from './themeModeContext';

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => readStorage('theme-mode', 'dark'));

  const toggleMode = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      writeStorage('theme-mode', nextMode);
      return nextMode;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const contextValue = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
