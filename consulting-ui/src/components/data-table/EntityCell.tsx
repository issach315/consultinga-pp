import { Avatar, Box, Typography } from '@mui/material';

interface EntityCellProps {
  primary: string;
  secondary?: string;
  /** Optional filled background color for the avatar — defaults to flat grey. */
  avatarColor?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/** Avatar-initials + primary/secondary text — the "who/what is this row" cell. */
export function EntityCell({ primary, secondary, avatarColor }: EntityCellProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
      <Avatar
        variant="rounded"
        sx={{
          width: 32,
          height: 32,
          fontSize: '0.7rem',
          fontWeight: 700,
          bgcolor: avatarColor ?? 'grey.100',
          color: avatarColor ? '#FFFFFF' : 'text.secondary',
        }}
      >
        {initials(primary)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={650} noWrap>
          {primary}
        </Typography>
        {secondary && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {secondary}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
