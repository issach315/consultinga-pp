import { Box, Button, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = 'No data yet',
  description = 'There is nothing to show here right now.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <Box
      role="status"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        py: 6,
        px: 3,
        color: 'text.secondary',
      }}
    >
      <Box sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }}>
        {icon ?? <InboxOutlinedIcon fontSize="inherit" />}
      </Box>
      <Typography variant="subtitle1" color="text.primary">
        {title}
      </Typography>
      <Typography variant="body2">{description}</Typography>
      {action && (
        <Button variant="outlined" size="small" onClick={action.onClick} sx={{ mt: 2 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
