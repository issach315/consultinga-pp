import { Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { ServerDataGrid, StatusPill, type useDataTableState } from '@/components/data-table';
import { formatDate } from '@/utils/formatters';
import type { Job, JobPriority, JobStatus } from '../types/job.types';

interface JobTableProps {
  rows: Job[];
  rowCount: number;
  loading: boolean;
  error: Error | null;
  tableState: ReturnType<typeof useDataTableState>;
  filters: React.ReactNode;
  canUpdate: boolean;
  isTenantAdmin: boolean;
  currentUserId?: string;
  onView: (job: Job) => void;
  onEdit: (job: Job) => void;
  onRetry: () => void;
}

const statusTone: Record<JobStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  OPEN: 'success',
  ON_HOLD: 'warning',
  CLOSED: 'default',
  FILLED: 'info',
  CANCELLED: 'error',
};

const priorityTone: Record<JobPriority, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

function AssignmentCell({ names }: { names: string[] }) {
  if (names.length === 0) return <Typography variant="body2">—</Typography>;
  return (
    <Tooltip title={names.join(', ')}>
      <Chip size="small" label={`${names.length} assigned`} variant="outlined" />
    </Tooltip>
  );
}

export function JobTable({ rows, rowCount, loading, error, tableState, filters, canUpdate, isTenantAdmin, currentUserId, onView, onEdit, onRetry }: JobTableProps) {
  const columns: GridColDef<Job>[] = [
    { field: 'jobCode', headerName: 'Job Code', minWidth: 175 },
    { field: 'jobTitle', headerName: 'Job Title', minWidth: 220, flex: 1 },
    { field: 'client', headerName: 'Client', minWidth: 180, valueGetter: (_value, row) => row.client.companyName },
    { field: 'positions', headerName: 'Positions', width: 95, align: 'center', headerAlign: 'center' },
    { field: 'experience', headerName: 'Experience', width: 120, sortable: false, valueGetter: (_value, row) => `${row.experienceMin}–${row.experienceMax} yrs` },
    { field: 'location', headerName: 'Location', minWidth: 150 },
    { field: 'workMode', headerName: 'Work Mode', width: 115, renderCell: (params) => <StatusPill label={params.value} /> },
    { field: 'priority', headerName: 'Priority', width: 110, renderCell: (params) => <StatusPill label={params.value} tone={priorityTone[params.value as JobPriority]} /> },
    { field: 'creator', headerName: 'Created By', minWidth: 170, valueGetter: (_value, row) => row.creator.name },
    { field: 'assignedRecruiters', headerName: 'Assigned Recruiters', minWidth: 165, sortable: false, renderCell: (params) => <AssignmentCell names={params.row.assignedRecruiters.map((entry) => entry.name)} /> },
    { field: 'assignedTeamLeads', headerName: 'Assigned Team Leads', minWidth: 165, sortable: false, renderCell: (params) => <AssignmentCell names={params.row.assignedTeamLeads.map((entry) => entry.name)} /> },
    { field: 'status', headerName: 'Status', width: 110, renderCell: (params) => <StatusPill label={params.value} tone={statusTone[params.value as JobStatus]} /> },
    { field: 'createdAt', headerName: 'Created At', width: 135, valueFormatter: (value: string) => formatDate(value) },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" onClick={() => onView(params.row)}>View</Button>
          {canUpdate && (isTenantAdmin || params.row.createdBy === currentUserId) && (
            <Button size="small" onClick={() => onEdit(params.row)}>Edit</Button>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <ServerDataGrid
      columns={columns}
      rows={rows}
      rowCount={rowCount}
      loading={loading}
      error={error}
      onRetry={onRetry}
      tableState={tableState}
      toolbarFilters={filters}
      searchPlaceholder="Search jobs…"
      emptyTitle="No requirements found"
      emptyDescription="Post a new job or adjust the current search and filters."
      itemLabel="jobs"
      height={620}
    />
  );
}
