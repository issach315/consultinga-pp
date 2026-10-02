import { useMemo, type ReactNode } from 'react';
import { Tooltip, Typography } from '@mui/material';
import type { GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { EntityCell, ServerDataGrid, StatusPill, type useDataTableState } from '@/components/data-table';
import { stringToColor } from '@/utils/avatarColor';
import { formatDate, formatFullName } from '@/utils/formatters';
import { getRoleLabel } from '../constants/roles';
import { EMPLOYEE_STATUS_LABELS, employeeStatusTone } from '../constants/permissions';
import { RowActionsMenu } from './RowActionsMenu';
import type { ModulePermission, TenantEmployee } from '../types/employee.types';
import { getModuleRowLabel } from '../utils/buildModuleRows';

interface TenantAdminEmployeeTableProps {
  rows: TenantEmployee[];
  rowCount: number;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  tableState: ReturnType<typeof useDataTableState>;
  toolbarFilters?: ReactNode;
  onView: (employee: TenantEmployee) => void;
  onEdit: (employee: TenantEmployee) => void;
  onManagePermissions: (employee: TenantEmployee) => void;
  onToggleStatus: (employee: TenantEmployee) => void;
  onResendInvite: (employee: TenantEmployee) => void;
  onRowClick: (employee: TenantEmployee) => void;
  selectionModel: GridRowSelectionModel;
  onSelectionModelChange: (model: GridRowSelectionModel) => void;
}

function permissionCount(permissions: ModulePermission[]): number {
  return permissions.reduce((sum, entry) => sum + entry.actions.length, 0);
}

function permissionSummary(permissions: ModulePermission[]): string {
  return permissions
    .filter((entry) => entry.actions.length > 0)
    .map((entry) => getModuleRowLabel(entry.module))
    .join(', ');
}

export function TenantAdminEmployeeTable({
  rows,
  rowCount,
  loading,
  error,
  onRetry,
  tableState,
  toolbarFilters,
  onView,
  onEdit,
  onManagePermissions,
  onToggleStatus,
  onResendInvite,
  onRowClick,
  selectionModel,
  onSelectionModelChange,
}: TenantAdminEmployeeTableProps) {
  const columns = useMemo<GridColDef<TenantEmployee>[]>(
    () => [
      { field: 'employeeId', headerName: 'Employee ID', width: 150 },
      {
        field: 'employee',
        headerName: 'Employee',
        flex: 1.2,
        minWidth: 200,
        renderCell: (params) => {
          const fullName = formatFullName(params.row.firstName, params.row.lastName);
          return (
            <EntityCell primary={fullName} secondary={getRoleLabel(params.row.role)} avatarColor={stringToColor(fullName)} />
          );
        },
      },
      { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
      {
        field: 'role',
        headerName: 'Role',
        width: 140,
        renderCell: (params) => <StatusPill label={getRoleLabel(params.row.role)} tone="info" />,
      },
      {
        field: 'permissions',
        headerName: 'Permissions',
        width: 170,
        sortable: false,
        renderCell: (params) => {
          const count = permissionCount(params.row.permissions);
          if (count === 0) {
            return (
              <Typography variant="body2" color="text.disabled">
                No access
              </Typography>
            );
          }
          const summary = permissionSummary(params.row.permissions);
          return (
            <Tooltip title={summary} disableHoverListener={!summary}>
              <span>
                <StatusPill label={`${count} permission${count === 1 ? '' : 's'}`} tone="default" />
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => (
          <StatusPill
            label={EMPLOYEE_STATUS_LABELS[params.row.status]}
            tone={employeeStatusTone(params.row.status)}
          />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created Date',
        width: 140,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'actions',
        headerName: '',
        width: 60,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <RowActionsMenu
            employee={params.row}
            onView={onView}
            onEdit={onEdit}
            onManagePermissions={onManagePermissions}
            onToggleStatus={onToggleStatus}
            onResendInvite={onResendInvite}
          />
        ),
      },
    ],
    [onView, onEdit, onManagePermissions, onToggleStatus, onResendInvite],
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
      searchPlaceholder="Search employees…"
      emptyTitle="No employees found"
      emptyDescription="Try adjusting your search or filters, or add a new employee."
      checkboxSelection
      rowSelectionModel={selectionModel}
      onRowSelectionModelChange={onSelectionModelChange}
      onRowClick={(params: GridRowParams<TenantEmployee>) => onRowClick(params.row)}
      toolbarFilters={toolbarFilters}
      itemLabel="employees"
    />
  );
}
