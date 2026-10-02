import type { ReactNode } from 'react';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { GridColDef } from '@mui/x-data-grid';
import { ServerDataGrid, StatusPill, type useDataTableState } from '@/components/data-table';
import { formatDate } from '@/utils/formatters';
import type { Client } from '../types/client.types';

interface ClientTableProps {
  rows: Client[];
  rowCount: number;
  loading: boolean;
  error?: Error | null;
  tableState: ReturnType<typeof useDataTableState>;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onRetry: () => void;
  statusFilterControl: ReactNode;
}

export function ClientTable({
  rows,
  rowCount,
  loading,
  error,
  tableState,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onRetry,
  statusFilterControl,
}: ClientTableProps) {
  const columns: GridColDef<Client>[] = [
    { field: 'clientCode', headerName: 'Client code', minWidth: 175 },
    {
      field: 'companyName',
      headerName: 'Company',
      minWidth: 220,
      flex: 1,
      renderCell: ({ row }) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {row.companyName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.industry || 'Industry not specified'}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'contactPersonName',
      headerName: 'Primary contact',
      minWidth: 220,
      flex: 1,
      renderCell: ({ row }) => (
        <Stack justifyContent="center" sx={{ height: '100%', minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {row.contactPersonName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.contactPersonEmail}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'city',
      headerName: 'Location',
      minWidth: 150,
      valueGetter: (_value, row) => [row.city, row.state].filter(Boolean).join(', ') || '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 115,
      renderCell: ({ row }) => (
        <StatusPill
          label={row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
          tone={row.status === 'ACTIVE' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'onboardedBy',
      headerName: 'Onboarded by',
      minWidth: 170,
      sortable: false,
      valueGetter: (_value, row) => row.onboardedBy.name,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 130,
      valueFormatter: (value: string) => formatDate(value),
    },
  ];

  if (canUpdate || canDelete) {
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" alignItems="center" sx={{ height: '100%' }}>
          {canUpdate && (
            <Tooltip title="Edit client">
              <IconButton
                size="small"
                aria-label={`Edit ${row.companyName}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(row);
                }}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete client">
              <IconButton
                size="small"
                color="error"
                aria-label={`Delete ${row.companyName}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(row);
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    });
  }

  return (
    <ServerDataGrid
      rows={rows}
      columns={columns}
      rowCount={rowCount}
      loading={loading}
      error={error}
      onRetry={onRetry}
      tableState={tableState}
      searchPlaceholder="Search clients…"
      toolbarFilters={statusFilterControl}
      emptyTitle="No clients onboarded"
      emptyDescription="Onboard your first client to begin tracking requirements."
      itemLabel="clients"
    />
  );
}
