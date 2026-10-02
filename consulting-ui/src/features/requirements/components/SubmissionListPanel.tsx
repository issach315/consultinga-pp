import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { ServerDataGrid, StatusPill, useDataTableState } from '@/components/data-table';
import { formatDate } from '@/utils/formatters';
import { useSubmissionListQuery } from '../api/submissionQueries';
import {
  SUBMISSION_STATUS_OPTIONS,
  type Submission,
  type SubmissionStatus,
} from '../types/submission.types';

export function SubmissionListPanel({
  jobId,
  canCreate,
  onCreate,
}: {
  jobId: string;
  canCreate: boolean;
  onCreate: () => void;
}) {
  const tableState = useDataTableState({ initialSortBy: 'createdAt' });
  const [status, setStatus] = useState<SubmissionStatus | ''>('');
  const query = useSubmissionListQuery(jobId, {
    ...tableState.queryParams,
    status: status || undefined,
  });
  const columns = useMemo<GridColDef<Submission>[]>(
    () => [
      { field: 'submissionCode', headerName: 'Submission ID', minWidth: 190, flex: 0.8 },
      {
        field: 'candidate',
        headerName: 'Candidate',
        minWidth: 220,
        flex: 1,
        valueGetter: (_value, row) => row.candidate.name,
      },
      {
        field: 'experience',
        headerName: 'Experience',
        width: 130,
        sortable: false,
        valueGetter: (_value, row) => `${row.relevantExperience} yrs relevant`,
      },
      {
        field: 'noticePeriodDays',
        headerName: 'Notice',
        width: 110,
        valueGetter: (value) => `${value} days`,
      },
      {
        field: 'submittedBy',
        headerName: 'Submitted by',
        minWidth: 180,
        flex: 0.7,
        valueGetter: (_value, row) => row.submitter.name,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 160,
        renderCell: ({ row }) => (
          <StatusPill
            label={row.status.replaceAll('_', ' ')}
            tone={
              row.status === 'REJECTED' ? 'error' : row.status === 'PLACED' ? 'success' : 'info'
            }
          />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Submitted at',
        width: 140,
        valueGetter: (value) => formatDate(value as string),
      },
      {
        field: 'actions',
        headerName: '',
        width: 64,
        sortable: false,
        filterable: false,
        renderCell: () => (
          <Tooltip title="Submission details">
            <IconButton size="small">
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  return (
    <ServerDataGrid
      columns={columns}
      rows={query.data?.items ?? []}
      rowCount={query.data?.meta.totalItems ?? 0}
      loading={query.isLoading || query.isFetching}
      error={query.error}
      onRetry={() => query.refetch()}
      tableState={tableState}
      height={500}
      itemLabel="submissions"
      searchPlaceholder="Search submissions or candidates..."
      emptyTitle="No candidates submitted"
      emptyDescription="Submit the first candidate for this job requirement."
      toolbarActions={
        canCreate ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
            Submit Candidate
          </Button>
        ) : undefined
      }
      toolbarFilters={
        <Stack direction="row">
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SubmissionStatus | '');
              tableState.setPaginationModel((current) => ({ ...current, page: 0 }));
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {SUBMISSION_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      }
    />
  );
}
