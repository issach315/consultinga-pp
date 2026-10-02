import { Alert, AlertTitle, Button, Stack } from '@mui/material';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      role="alert"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      <Stack spacing={0.5}>
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Stack>
    </Alert>
  );
}
