import { Box, CircularProgress } from '@mui/material';

export function PageLoader() {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
