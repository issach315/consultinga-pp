import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <Box
      id="main-content"
      component="main"
      tabIndex={-1}
      sx={{ maxWidth: 1400, mx: 'auto', width: '100%', outline: 'none' }}
    >
      {children}
    </Box>
  );
}
