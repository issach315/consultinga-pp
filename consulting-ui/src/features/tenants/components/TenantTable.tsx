import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { EntityCell, ServerDataGrid, StatusPill, type useDataTableState } from '@/components/data-table';
import { formatDate } from '@/utils/formatters';
import { PLAN_TONE } from '../constants/plans';
import type { TenantPlanId } from '../constants/plans';
import type { TenantListItem } from '../types/tenant.types';

interface TenantTableProps {
  rows: TenantListItem[];
  rowCount: number;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  tableState: ReturnType<typeof useDataTableState>;
  onDelete: (tenant: TenantListItem) => void;
  selectionModel: GridRowSelectionModel;
  onSelectionModelChange: (model: GridRowSelectionModel) => void;
  toolbarFilters?: React.ReactNode;
}

function RowActionsMenu({ tenant, onDelete }: { tenant: TenantListItem; onDelete: (tenant: TenantListItem) => void }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        }}
        aria-label="Row actions"
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate(`/tenants/${tenant.id}/edit`);
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(tenant);
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function TenantTable({
  rows,
  rowCount,
  loading,
  error,
  onRetry,
  tableState,
  onDelete,
  selectionModel,
  onSelectionModelChange,
  toolbarFilters,
}: TenantTableProps) {
  const navigate = useNavigate();
  const columns = useMemo<GridColDef<TenantListItem>[]>(
    () => [
      {
        field: 'legalCompanyName',
        headerName: 'Company',
        flex: 1.4,
        minWidth: 220,
        sortable: false,
        renderCell: (params) => <EntityCell primary={params.row.legalCompanyName} secondary={params.row.adminEmail} />,
      },
      { field: 'tenantCode', headerName: 'Tenant code', width: 130, sortable: false },
      {
        field: 'plan',
        headerName: 'Plan',
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <StatusPill label={params.value} tone={PLAN_TONE[params.value as TenantPlanId] ?? 'default'} />
        ),
      },
      { field: 'employeeLimit', headerName: 'Employees', width: 100, type: 'number', sortable: false },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 110,
        sortable: false,
        renderCell: (params) => (
          <StatusPill label={params.value ? 'Active' : 'Inactive'} tone={params.value ? 'success' : 'default'} />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 120,
        sortable: false,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'actions',
        headerName: '',
        width: 60,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => <RowActionsMenu tenant={params.row} onDelete={onDelete} />,
      },
    ],
    [onDelete],
  );

  return (
    <ServerDataGrid
      columns={columns}
      rows={rows}
      rowCount={rowCount}
      loading={loading}
      error={error}
      onRetry={onRetry}
      tableState={tableState}
      searchPlaceholder="Search tenants…"
      emptyTitle="No tenants found"
      emptyDescription="Create a tenant to get started."
      checkboxSelection
      rowSelectionModel={selectionModel}
      onRowSelectionModelChange={onSelectionModelChange}
      toolbarFilters={toolbarFilters}
      itemLabel="tenants"
      onRowClick={(params) => navigate(`/tenants/${params.id}`)}
    />
  );
}
