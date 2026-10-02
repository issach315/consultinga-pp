import { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StatusPill } from '@/components/data-table';
import { PageHeader } from '@/components/layout';
import { useAccess } from '@/features/access';
import { useAuth } from '@/features/auth';
import { formatDate } from '@/utils/formatters';
import { useJobDetailQuery } from '../api/jobQueries';
import { SubmissionListPanel } from '../components/SubmissionListPanel';

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState<string | null>(
    (location.state as { notice?: string } | null)?.notice ?? null,
  );
  const { user } = useAuth();
  const { can } = useAccess();
  const query = useJobDetailQuery(id);
  const tab = searchParams.get('tab') ?? 'overview';

  if (query.isLoading)
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  if (query.error || !query.data)
    return <Alert severity="error">{query.error?.message ?? 'Job not found.'}</Alert>;
  const job = query.data;
  const canEdit =
    can('requirements', 'requirements', 'UPDATE') &&
    (job.createdBy === user?.id || user?.roles.some((role) => role.code === 'TENANT_ADMIN'));
  const canCreateSubmission = can('requirements', 'submissions', 'CREATE');

  return (
    <>
      <PageHeader
        title={job.jobTitle}
        description={`${job.jobCode} · ${job.client.companyName}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Requirements', path: '/clients' },
          { label: 'Jobs', path: '/clients/requirements' },
          { label: job.jobCode },
        ]}
        actions={
          canEdit ? (
            <Button
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={() => navigate(`/clients/requirements/${job.id}/edit`)}
            >
              Edit job
            </Button>
          ) : undefined
        }
      />
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value: string) =>
            setSearchParams(value === 'overview' ? {} : { tab: value })
          }
          sx={{ px: 2 }}
        >
          <Tab value="overview" label="Overview" />
          <Tab value="submissions" label="Submissions" />
          <Tab value="activity" label="Activity" />
        </Tabs>
      </Paper>

      {tab === 'submissions' && id && (
        <SubmissionListPanel
          jobId={id}
          canCreate={canCreateSubmission}
          onCreate={() => navigate(`/clients/requirements/${id}/submissions/new`)}
        />
      )}

      {tab === 'activity' && (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6">Job activity</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Submission status history is recorded automatically and will appear here as the activity
            feed expands.
          </Typography>
        </Paper>
      )}

      {tab === 'overview' && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <StatusPill label={job.status} tone="success" />
                <StatusPill label={job.priority} tone="warning" />
              </Stack>
              <Grid container spacing={3}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Detail label="Positions" value={job.positions} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Detail
                    label="Experience"
                    value={`${job.experienceMin}–${job.experienceMax} years`}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Detail label="Work mode" value={job.workMode} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Detail label="Employment" value={job.employmentType.replace('_', ' ')} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Detail label="Location" value={job.location} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Detail label="Salary range" value={job.salaryRange} />
                </Grid>
              </Grid>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
                Required skills
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {job.skills.map((skill) => (
                  <Chip key={skill} label={skill} />
                ))}
              </Stack>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {job.description || 'No description provided.'}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Client and ownership
                </Typography>
                <Stack spacing={2}>
                  <Detail label="Client" value={job.client.companyName} />
                  <Detail label="Created by" value={job.creator.name} />
                  <Detail label="Created at" value={formatDate(job.createdAt)} />
                </Stack>
              </Paper>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Assignment
                </Typography>
                <Detail
                  label="Recruiters"
                  value={job.assignedRecruiters.map((person) => person.name).join(', ')}
                />
                <Box sx={{ mt: 2 }}>
                  <Detail
                    label="Team leads"
                    value={job.assignedTeamLeads.map((person) => person.name).join(', ')}
                  />
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      )}
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        message={notice}
        onClose={() => {
          setNotice(null);
          navigate(`${location.pathname}?tab=submissions`, { replace: true, state: {} });
        }}
      />
    </>
  );
}
