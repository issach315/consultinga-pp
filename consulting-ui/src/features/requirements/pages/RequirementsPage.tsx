import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Button, MenuItem, Snackbar, Stack, TextField } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDataTableState } from '@/components/data-table';
import { PageHeader } from '@/components/layout';
import { useAccess } from '@/features/access';
import { useAuth } from '@/features/auth';
import { useClientListQuery } from '../api/clientQueries';
import { useJobAssigneesQuery, useJobListQuery } from '../api/jobQueries';
import { JobTable } from '../components/JobTable';
import { JOB_PRIORITY_OPTIONS, JOB_STATUS_OPTIONS, type JobPriority, type JobStatus } from '../types/job.types';

export function RequirementsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { can } = useAccess();
  const tableState = useDataTableState({ initialSortBy: 'createdAt' });
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<JobStatus | ''>('');
  const [priority, setPriority] = useState<JobPriority | ''>('');
  const [recruiterId, setRecruiterId] = useState('');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [notice, setNotice] = useState<string | null>((location.state as { notice?: string } | null)?.notice ?? null);

  const resetPage = () => tableState.setPaginationModel((current) => ({ ...current, page: 0 }));
  const clients = useClientListQuery({ page: 1, pageSize: 100, status: 'ACTIVE', sortBy: 'companyName', sortOrder: 'asc' });
  const recruiters = useJobAssigneesQuery('RECRUITER');
  const teamLeads = useJobAssigneesQuery('TEAMLEAD');
  const creators = useJobAssigneesQuery('BDM');
  const jobs = useJobListQuery({
    ...tableState.queryParams,
    clientId: clientId || undefined,
    status: status || undefined,
    priority: priority || undefined,
    recruiterId: recruiterId || undefined,
    teamLeadId: teamLeadId || undefined,
    createdBy: createdBy || undefined,
  });
  const canCreate = can('requirements', 'requirements', 'CREATE');
  const canUpdate = can('requirements', 'requirements', 'UPDATE');
  const isTenantAdmin = user?.roles.some((role) => role.code === 'TENANT_ADMIN') ?? false;

  const closeNotice = () => {
    setNotice(null);
    if ((location.state as { notice?: string } | null)?.notice) navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <>
      <PageHeader
        title="Jobs (Requirements)"
        description="Manage client job requirements and delivery-team assignments."
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Requirements', path: '/clients' }, { label: 'Jobs' }]}
        actions={canCreate ? <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/clients/requirements/new')}>Post New Job</Button> : undefined}
      />
      <JobTable
        rows={jobs.data?.items ?? []}
        rowCount={jobs.data?.meta.totalItems ?? 0}
        loading={jobs.isLoading || jobs.isFetching}
        error={jobs.error}
        tableState={tableState}
        canUpdate={canUpdate}
        currentUserId={user?.id}
        isTenantAdmin={isTenantAdmin}
        onView={(job) => navigate(`/clients/requirements/${job.id}`)}
        onEdit={(job) => navigate(`/clients/requirements/${job.id}/edit`)}
        onRetry={() => jobs.refetch()}
        filters={
          <Stack direction="row" gap={1} flexWrap="wrap">
            <TextField select size="small" label="Client" value={clientId} onChange={(event) => { setClientId(event.target.value); resetPage(); }} sx={{ minWidth: 150 }}>
              <MenuItem value="">All clients</MenuItem>
              {clients.data?.items.map((client) => <MenuItem key={client.id} value={client.id}>{client.companyName}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Status" value={status} onChange={(event) => { setStatus(event.target.value as JobStatus | ''); resetPage(); }} sx={{ minWidth: 130 }}>
              <MenuItem value="">All statuses</MenuItem>
              {JOB_STATUS_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Priority" value={priority} onChange={(event) => { setPriority(event.target.value as JobPriority | ''); resetPage(); }} sx={{ minWidth: 130 }}>
              <MenuItem value="">All priorities</MenuItem>
              {JOB_PRIORITY_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Recruiter" value={recruiterId} onChange={(event) => { setRecruiterId(event.target.value); resetPage(); }} sx={{ minWidth: 150 }}>
              <MenuItem value="">All recruiters</MenuItem>
              {recruiters.data?.map((person) => <MenuItem key={person.id} value={person.id}>{person.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Team Lead" value={teamLeadId} onChange={(event) => { setTeamLeadId(event.target.value); resetPage(); }} sx={{ minWidth: 150 }}>
              <MenuItem value="">All team leads</MenuItem>
              {teamLeads.data?.map((person) => <MenuItem key={person.id} value={person.id}>{person.name}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Created By" value={createdBy} onChange={(event) => { setCreatedBy(event.target.value); resetPage(); }} sx={{ minWidth: 150 }}>
              <MenuItem value="">All creators</MenuItem>
              {creators.data?.map((person) => <MenuItem key={person.id} value={person.id}>{person.name}</MenuItem>)}
            </TextField>
          </Stack>
        }
      />
      <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={closeNotice} message={notice} />
    </>
  );
}

export default RequirementsPage;
