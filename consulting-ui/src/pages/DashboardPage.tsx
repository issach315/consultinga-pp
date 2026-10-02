import { Box, Card, CardContent, Grid, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAccess } from '@/features/access';
import { REQUIREMENTS_MODULE_KEY, REQUIREMENTS_SUB_MODULES } from '@/features/requirements/constants';

const legacyStats = [
  { label: 'Employees', value: '—', icon: PeopleOutlinedIcon },
  { label: 'Open roles', value: '—', icon: BadgeOutlinedIcon },
  { label: "Today's attendance", value: '—', icon: EventAvailableOutlinedIcon },
  { label: 'Upcoming pay run', value: '—', icon: PaymentsOutlinedIcon },
];

const SUB_MODULE_ICONS: Record<string, SvgIconComponent> = {
  clients: BusinessOutlinedIcon,
  requirements: AssignmentOutlinedIcon,
  submissions: AssignmentTurnedInOutlinedIcon,
  interviews: EventOutlinedIcon,
  placements: WorkOutlineOutlinedIcon,
};

/** Platform-wide dashboard for Super Admins — unchanged, not tied to any tenant's modules. */
function PlatformDashboard({ firstName }: { firstName?: string }) {
  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Here's an overview of your organization."
      />
      <Grid container spacing={2}>
        {legacyStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Icon color="primary" sx={{ mb: 1 }} />
                  <Typography variant="h5">{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}

function WorkspaceCard({ label, path, icon: Icon }: { label: string; path: string; icon: SvgIconComponent }) {
  const navigate = useNavigate();

  return (
    <Card
      variant="outlined"
      onClick={() => navigate(path)}
      sx={{
        cursor: 'pointer',
        height: '100%',
        transition: (theme) => theme.transitions.create(['transform', 'box-shadow', 'border-color']),
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, borderColor: 'text.secondary' },
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2.5,
            bgcolor: 'background.default',
          }}
        >
          <Icon fontSize="small" />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.25 }}>
          —
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="caption" color="text.secondary">
            Coming soon
          </Typography>
          <Typography variant="caption" color="text.secondary">
            View {label.toLowerCase()} →
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function LivePill() {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        px: 1.25,
        height: 24,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 999,
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: 'success.light',
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.success.lighter}`,
        }}
      />
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        Live updates
      </Typography>
    </Stack>
  );
}

/** No activity feed exists yet — this is the shell the panel will fill in
 * once one does. Each future row gets its own green "live" dot next to the
 * user avatar, matching the LivePill's dot above. */
function LiveActivityPanel() {
  return (
    <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            Live activity
          </Typography>
          <LivePill />
        </Stack>
        <Select size="small" defaultValue="all" sx={{ minWidth: 150 }}>
          <MenuItem value="all">All activity</MenuItem>
          <MenuItem value="requirements">Requirements</MenuItem>
          <MenuItem value="submissions">Submissions</MenuItem>
          <MenuItem value="interviews">Interviews</MenuItem>
        </Select>
      </Stack>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState
          title="No recent activity yet"
          description="Activity from your team will show up here once Requirements is in use."
        />
      </Box>
    </Paper>
  );
}

/** Tenant employee dashboard — cards only for the Requirements sub-modules
 * this employee actually has access to (tenant module enabled AND at least
 * READ granted), matching the same effective-access rules the sidebar uses. */
function EmployeeWorkspaceDashboard({ firstName }: { firstName?: string }) {
  const { access } = useAccess();
  const requirementsAccess = access?.modules[REQUIREMENTS_MODULE_KEY];

  const visibleSubModules = REQUIREMENTS_SUB_MODULES.filter(
    (sub) => requirementsAccess?.enabled && (requirementsAccess.subModules[sub.key]?.length ?? 0) > 0,
  );

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Here's a quick overview of your recruitment activity."
      />

      {visibleSubModules.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            title="No modules available yet"
            description="You don't have access to any Requirements sub-modules. Contact your tenant admin to get access."
          />
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.55fr) minmax(360px, 1fr)' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <Grid container spacing={1.75} alignContent="flex-start">
            {visibleSubModules.map((sub) => (
              <Grid key={sub.key} size={{ xs: 12, sm: 6, lg: 4 }}>
                <WorkspaceCard label={sub.label} path={sub.path} icon={SUB_MODULE_ICONS[sub.key] ?? AssignmentOutlinedIcon} />
              </Grid>
            ))}
          </Grid>

          <LiveActivityPanel />
        </Box>
      )}
    </>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const roleCodes = user?.roles.map((role) => role.code) ?? [];
  const isSuperAdmin = roleCodes.includes('SUPER_ADMIN');

  if (isSuperAdmin) {
    return <PlatformDashboard firstName={user?.firstName} />;
  }

  return <EmployeeWorkspaceDashboard firstName={user?.firstName} />;
}

export default DashboardPage;
