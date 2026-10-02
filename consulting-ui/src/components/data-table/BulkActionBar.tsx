import { Box, Button, Stack, Typography } from '@mui/material';

export interface BulkAction {
  label: string;
  onClick: () => void;
  color?: 'primary' | 'error';
  loading?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

/** Appears above the table when rows are checked — hidden entirely otherwise. */
export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        px: 2.5,
        py: 1.25,
        bgcolor: 'action.hover',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" fontWeight={700}>
          {selectedCount} selected
        </Typography>
        {actions.map((action) => (
          <Button
            key={action.label}
            size="small"
            variant="outlined"
            color={action.color ?? 'primary'}
            loading={action.loading}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
      <Button size="small" onClick={onClear}>
        Clear selection
      </Button>
    </Box>
  );
}
