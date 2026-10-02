import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface LabeledFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

/** Label sits above the field (not floating inside it) — matches the reference layout. */
export function LabeledField({ label, required, children }: LabeledFieldProps) {
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.75 }}>
        {label}
        {required && <Typography component="span" color="error.main">{' *'}</Typography>}
      </Typography>
      {children}
    </Box>
  );
}
