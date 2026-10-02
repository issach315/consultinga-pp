import { Grid } from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { EmployeeStatsCard, type EmployeeStatAccent } from './EmployeeStatsCard';
import type { TenantEmployeeSummary } from '../types/employee.types';

interface EmployeeStatCardsProps {
  summary: TenantEmployeeSummary | undefined;
}

interface StatConfig {
  label: string;
  value: string;
  icon: typeof PeopleOutlinedIcon;
  accent: EmployeeStatAccent;
  badge: string;
  ringValue?: number;
}

/** Share of total, as a whole-percent string — real data derived from the
 * summary endpoint, never a fabricated period-over-period trend (the API
 * doesn't return historical snapshots to compare against). */
function shareOfTotal(count: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

/** Tenant-wide counts from the summary endpoint — independent of the table's current filters/page. */
export function EmployeeStatCards({ summary }: EmployeeStatCardsProps) {
  const stats: StatConfig[] = [
    {
      label: 'Total Employees',
      value: summary ? String(summary.total) : '—',
      icon: PeopleOutlinedIcon,
      accent: 'neutral',
      badge: 'All time',
    },
    {
      label: 'Active Employees',
      value: summary ? String(summary.active) : '—',
      icon: CheckCircleOutlineIcon,
      accent: 'success',
      badge: summary ? `${shareOfTotal(summary.active, summary.total)} of total` : '—',
    },
    {
      label: 'Invited Employees',
      value: summary ? String(summary.invited) : '—',
      icon: MailOutlineIcon,
      accent: 'info',
      badge: summary ? `${shareOfTotal(summary.invited, summary.total)} of total` : '—',
    },
    {
      label: 'Avg. Permissions Granted',
      value: summary ? `${summary.avgPermissionGrantPct}%` : '—',
      icon: ShieldOutlinedIcon,
      accent: 'neutral',
      badge: 'Across enabled modules',
      ringValue: summary?.avgPermissionGrantPct,
    },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat) => (
        <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <EmployeeStatsCard
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            accent={stat.accent}
            badge={stat.badge}
            ringValue={stat.ringValue}
          />
        </Grid>
      ))}
    </Grid>
  );
}
