import { Chip, type ChipProps } from '@mui/material';

type PillTone = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusPillProps {
  label: string;
  tone?: PillTone;
}

/** Compact, fully-rounded status chip — same theme colors as Chip, tighter shape. */
export function StatusPill({ label, tone = 'default' }: StatusPillProps) {
  return (
    <Chip
      label={label}
      size="small"
      color={tone as ChipProps['color']}
      sx={{ borderRadius: 999, fontSize: '0.7rem' }}
    />
  );
}
