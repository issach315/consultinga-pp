import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { ServerDataGrid, type useDataTableState } from '@/components/data-table';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Employee, EmployeeStatus } from '../types/employee.types';

const statusColor: Record<EmployeeStatus, 'success' | 'default' | 'warning'> = {
  active: 'success',
  inactive: 'default',
  on_leave: 'warning',
};

const statusLabel: Record<EmployeeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On leave',
};

interface EmployeeTableProps {
  rows: Employee[];
  rowCount: number;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  tableState: ReturnType<typeof useDataTableState>;
}

export function EmployeeTable({
  rows,
  rowCount,
  loading,
  error,
  onRetry,
  tableState,
}: EmployeeTableProps) {
  const navigate = useNavigate();

  const columns = useMemo<GridColDef<Employee>[]>(
    () => [
      {
        field: 'firstName',
        headerName: 'First name',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'lastName',
        headerName: 'Last name',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.4,
        minWidth: 200,
      },
      {
        field: 'jobTitle',
        headerName: 'Job title',
        flex: 1,
        minWidth: 160,
      },
      {
        field: 'department',
        headerName: 'Department',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 130,
        renderCell: (params) => (
          <Chip
            label={statusLabel[params.value as EmployeeStatus]}
            color={statusColor[params.value as EmployeeStatus]}
            size="small"
          />
        ),
      },
      {
        field: 'hireDate',
        headerName: 'Hire date',
        width: 130,
        valueFormatter: (value: string) => formatDate(value),
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 130,
        type: 'number',
        valueFormatter: (value: number) => formatCurrency(value),
      },
    ],
    [],
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
      emptyDescription="Try adjusting your search or filters."
      onRowClick={(params) => navigate(`/employees/${params.id}`)}
    />
  );
}
