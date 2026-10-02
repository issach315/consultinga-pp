import { useMemo, useState } from 'react';
import { Alert, Button, IconButton, Paper, Snackbar, Stack, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import type { GridRowSelectionModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { ErrorState, LoadingState } from '@/components/common';
import { BulkActionBar, StatusTabs, type StatusTabOption } from '@/components/data-table';
import { useMyTenantQuery } from '@/features/tenants/api/tenantQueries';
import { ApiError } from '@/types';
import { getRoleOptionsForTenantType } from '../constants/roles';
import { useTenantAdminEmployees } from '../hooks/useTenantAdminEmployees';
import {
  useReissueInvitationMutation,
  useTenantAdminEmployeeSummaryQuery,
  useUpdateTenantAdminEmployeeStatusMutation,
} from '../api/employeeQueries';
import { TenantAdminEmployeeTable } from '../components/TenantAdminEmployeeTable';
import { TenantAdminEmployeeFilters } from '../components/TenantAdminEmployeeFilters';
import { EmployeeStatCards } from '../components/EmployeeStatCards';
import { StatusConfirmDialog } from '../components/StatusConfirmDialog';
import { EmployeeIdPrefixDialog } from '../components/EmployeeIdPrefixDialog';
import type { TenantEmployee, TenantEmployeeStatus } from '../types/employee.types';

type StatusTabValue = 'ALL' | TenantEmployeeStatus;

type Feedback = { message: string; severity: 'success' | 'warning' | 'error' } | null;

const STATUS_TAB_OPTIONS: StatusTabOption<StatusTabValue>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INVITED', label: 'Invited' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export function TenantAdminEmployeesPage() {
  const navigate = useNavigate();
  const tenantQuery = useMyTenantQuery();
  const tenant = tenantQuery.data;
  const roleOptions = useMemo(
    () => (tenant ? getRoleOptionsForTenantType(tenant.tenantType) : []),
    [tenant],
  );

  const { tableState, roles, setRoles, statuses, setStatuses, employeesQuery } =
    useTenantAdminEmployees(tenant?.id);
  const summaryQuery = useTenantAdminEmployeeSummaryQuery(tenant?.id);
  const reissueInvitation = useReissueInvitationMutation(tenant?.id ?? '');
  const updateStatus = useUpdateTenantAdminEmployeeStatusMutation(tenant?.id ?? '');

  const statusTab: StatusTabValue = statuses.length === 1 ? statuses[0]! : 'ALL';
  const handleStatusTabChange = (value: StatusTabValue) => setStatuses(value === 'ALL' ? [] : [value]);
  const totalCount = employeesQuery.data?.meta.totalItems ?? 0;

  const [statusEmployee, setStatusEmployee] = useState<TenantEmployee | null>(null);
  const [prefixDialogOpen, setPrefixDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [bulkActionPending, setBulkActionPending] = useState(false);

  const notify = (message: string, severity: 'success' | 'warning' | 'error' = 'success') =>
    setFeedback({ message, severity });

  const goToDetail = (employee: TenantEmployee, tab?: 'edit' | 'permissions') =>
    navigate(`/tenant-admin/employees/${employee.id}`, tab ? { state: { tab } } : undefined);

  const rows = employeesQuery.data?.items ?? [];
  const selectedIds = selectionModel.map(String);
  const selectedRows = rows.filter((row) => selectedIds.includes(row.id));

  const handleResendInvite = async (employee: TenantEmployee) => {
    try {
      await reissueInvitation.mutateAsync(employee.id);
      notify(
        employee.status === 'INVITED'
          ? `Invitation resent to ${employee.email}.`
          : `Password reset link sent to ${employee.email}.`,
      );
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Unable to send the link.', 'error');
    }
  };

  const handleBulkResendInvite = async () => {
    const targets = selectedRows.filter((row) => row.status === 'INVITED');
    setBulkActionPending(true);
    try {
      const outcomes = await Promise.allSettled(targets.map((row) => reissueInvitation.mutateAsync(row.id)));
      const succeeded = outcomes.filter((outcome) => outcome.status === 'fulfilled').length;
      const skipped = selectedRows.length - targets.length;
      notify(
        `${succeeded} of ${targets.length} invitation(s) resent${skipped > 0 ? ` (${skipped} skipped — not Invited)` : ''}.`,
        succeeded < targets.length ? 'warning' : 'success',
      );
      setSelectionModel([]);
    } finally {
      setBulkActionPending(false);
    }
  };

  const handleBulkDeactivate = async () => {
    const targets = selectedRows.filter((row) => row.status !== 'INACTIVE');
    setBulkActionPending(true);
    try {
      const outcomes = await Promise.allSettled(
        targets.map((row) => updateStatus.mutateAsync({ id: row.id, status: 'INACTIVE' })),
      );
      const succeeded = outcomes.filter((outcome) => outcome.status === 'fulfilled').length;
      notify(
        `${succeeded} of ${targets.length} employee(s) deactivated.`,
        succeeded < targets.length ? 'warning' : 'success',
      );
      setSelectionModel([]);
    } finally {
      setBulkActionPending(false);
    }
  };

  if (tenantQuery.isLoading) return <LoadingState variant="card" />;
  if (tenantQuery.isError || !tenant) {
    return (
      <ErrorState
        message={tenantQuery.error?.message ?? 'Unable to load your tenant.'}
        onRetry={() => tenantQuery.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description={`Manage employee accounts, roles, and permissions for ${tenant.legalCompanyName}.`}
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Employees' }]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Employee ID prefix">
              <IconButton
                onClick={() => setPrefixDialogOpen(true)}
                aria-label="Employee ID prefix settings"
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <SettingsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<GroupAddOutlinedIcon />}
              onClick={() => navigate('/tenant-admin/employees/bulk')}
            >
              Bulk register
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/tenant-admin/employees/new')}
            >
              Add Employee
            </Button>
          </Stack>
        }
      />

      <Stack spacing={2}>
        <EmployeeStatCards summary={summaryQuery.data} />

        <BulkActionBar
          selectedCount={selectedIds.length}
          onClear={() => setSelectionModel([])}
          actions={[
            { label: 'Resend invitation', onClick: handleBulkResendInvite, loading: bulkActionPending },
            { label: 'Deactivate', color: 'error', onClick: handleBulkDeactivate, loading: bulkActionPending },
          ]}
        />

        <Paper
          variant="outlined"
          sx={{
            px: { xs: 1, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <StatusTabs value={statusTab} options={STATUS_TAB_OPTIONS} onChange={handleStatusTabChange} />
          <Typography variant="body2" color="text.secondary">
            {totalCount} {totalCount === 1 ? 'employee' : 'employees'}
          </Typography>
        </Paper>

        <TenantAdminEmployeeTable
          rows={rows}
          rowCount={totalCount}
          loading={employeesQuery.isLoading || employeesQuery.isFetching}
          error={employeesQuery.error}
          onRetry={() => employeesQuery.refetch()}
          tableState={tableState}
          toolbarFilters={<TenantAdminEmployeeFilters roleOptions={roleOptions} roles={roles} onRolesChange={setRoles} />}
          onView={(employee) => goToDetail(employee)}
          onEdit={(employee) => goToDetail(employee, 'edit')}
          onManagePermissions={(employee) => goToDetail(employee, 'permissions')}
          onToggleStatus={setStatusEmployee}
          onResendInvite={handleResendInvite}
          onRowClick={(employee) => goToDetail(employee)}
          selectionModel={selectionModel}
          onSelectionModelChange={setSelectionModel}
        />
      </Stack>

      <StatusConfirmDialog employee={statusEmployee} onClose={() => setStatusEmployee(null)} onSuccess={notify} />

      <EmployeeIdPrefixDialog
        open={prefixDialogOpen}
        tenant={tenant}
        onClose={() => setPrefixDialogOpen(false)}
        onSaved={() => notify('Employee ID prefix updated.')}
      />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ width: '100%' }}>
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}

export default TenantAdminEmployeesPage;
