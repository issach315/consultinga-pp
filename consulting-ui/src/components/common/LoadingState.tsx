import { Box, Skeleton, Stack } from '@mui/material';

interface LoadingStateProps {
  rows?: number;
  variant?: 'table' | 'card' | 'inline';
}

export function LoadingState({ rows = 5, variant = 'table' }: LoadingStateProps) {
  if (variant === 'inline') {
    return <Skeleton variant="text" width="60%" aria-label="Loading" />;
  }

  if (variant === 'card') {
    return (
      <Stack spacing={2} aria-label="Loading">
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
      </Stack>
    );
  }

  return (
    <Stack spacing={1} aria-label="Loading" sx={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
        </Box>
      ))}
    </Stack>
  );
}
