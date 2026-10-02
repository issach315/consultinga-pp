import { Box, Typography, useTheme } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

export type EmployeeStatAccent = 'neutral' | 'success' | 'info';

export interface EmployeeStatsCardProps {
  label: string;
  value: string;
  icon: SvgIconComponent;
  accent: EmployeeStatAccent;
  badge: string;
  /** 0–100. Only the Avg. Permissions card passes this — draws a small ring meter. */
  ringValue?: number;
}

/** Small ring meter: fill = accent color, track = a lighter step of the same
 * ramp (never a generic gray) so state reads even at this size. */
function RingMeter({ value, color, trackColor }: { value: number; color: string; trackColor: string }) {
  const size = 34;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference * (1 - clamped / 100);

  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      sx={{ flexShrink: 0, transform: 'rotate(-90deg)' }}
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Box>
  );
}

/** Compact enterprise stat tile. Presentational only — all values arrive via
 * props so the four dashboard cards stay a config array, not duplicated markup. */
export function EmployeeStatsCard({ label, value, icon: Icon, accent, badge, ringValue }: EmployeeStatsCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const accentColor =
    accent === 'success'
      ? theme.palette.success.main
      : accent === 'info'
        ? theme.palette.info.main
        : theme.palette.text.primary;

  const iconBg =
    accent === 'success'
      ? theme.palette.success.lighter
      : accent === 'info'
        ? theme.palette.info.lighter
        : isDark
          ? theme.palette.grey[800]
          : theme.palette.grey[100];

  const iconColor =
    accent === 'success' ? theme.palette.success.dark : accent === 'info' ? theme.palette.info.dark : theme.palette.text.primary;

  const ringTrack = isDark ? theme.palette.grey[700] : theme.palette.grey[200];

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 152,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px',
        pl: 2.5,
        pr: 2,
        py: 2,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        transition: theme.transitions.create(['transform', 'box-shadow', 'border-color'], {
          duration: 150,
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.10)',
          borderColor: accentColor,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: accentColor,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '11px',
            bgcolor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon aria-hidden="true" sx={{ fontSize: 20, color: iconColor }} />
        </Box>
        {ringValue !== undefined && <RingMeter value={ringValue} color={accentColor} trackColor={ringTrack} />}
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: { xs: 24, sm: 28 },
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
        >
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.25 }}>
          {label}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.01em' }}>
        {badge}
      </Typography>
    </Box>
  );
}
