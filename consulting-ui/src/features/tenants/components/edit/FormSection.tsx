import type { ReactNode } from 'react';
import { Box, Card, Divider, Stack, Typography } from '@mui/material';

interface FormSectionProps {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}

// Compact section card shared by every part of the tenant edit form —
// matches the app's flat, bordered card language (see theme.ts MuiCard).
export function FormSection({ icon, title, description, children }: FormSectionProps) {
  return (
    <Card>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ px: 3, py: 2.25 }}>
        <Box sx={{ display: 'flex', color: 'text.secondary', mt: 0.25 }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider />
      <Box sx={{ px: 3, py: 2.5 }}>{children}</Box>
    </Card>
  );
}
