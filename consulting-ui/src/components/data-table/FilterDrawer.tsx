import type { ReactNode } from 'react';
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  title?: string;
  applyLabel?: string;
  children: ReactNode;
}

/** Slide-out panel that holds every filter facet for a table — the single place filters live. */
export function FilterDrawer({
  open,
  onClose,
  onApply,
  onClear,
  title = 'Filters',
  applyLabel = 'Apply Filters',
  children,
}: FilterDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 360 }, display: 'flex', flexDirection: 'column' } } }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close filters">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />

      <Stack spacing={3} sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
        {children}
      </Stack>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1.5 }}>
        <Button variant="outlined" fullWidth onClick={onClear}>
          Clear all
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            onApply();
            onClose();
          }}
        >
          {applyLabel}
        </Button>
      </Box>
    </Drawer>
  );
}
