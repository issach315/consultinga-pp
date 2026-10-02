import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '4rem' }}>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary">
        This page doesn't exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </Button>
    </Box>
  );
}

export default NotFoundPage;
