import { useState } from 'react';
import { Alert, Box, Snackbar, Tab, Tabs } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { EmptyState, ErrorState, LoadingState } from '@/components/common';
import { useMyTenantQuery } from '@/features/tenants/api/tenantQueries';
import { ApiError } from '@/types';
import { formatFullName } from '@/utils/formatters';
import {
  useReissueInvitationMutation,
  useTenantAdminEmployeeDetailQuery,
  useTenantAdminEmployeeListQuery,
} from '../api/employeeQueries';
import { EmployeeDetailHeader } from '../components/detail/EmployeeDetailHeader';
import { EmployeeOverviewTab } from '../components/detail/EmployeeOverviewTab';
import { EmployeeEditTab } from '../components/detail/EmployeeEditTab';
import { EmployeePermissionsTab } from '../components/detail/EmployeePermissionsTab';
import { StatusConfirmDialog } from '../components/StatusConfirmDialog';
import type { TenantEmployee } from '../types/employee.types';

const TABS = ['overview', 'edit', 'permissions'] as const;
type TabKey = (typeof TABS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  edit: 'Edit Details',
  permissions: 'Permissions',
};

function isTabKey(value: unknown): value is TabKey {
  return typeof value === 'string' && (TABS as readonly string[]).includes(value);
}

type Feedback = { message: string; severity: 'success' | 'error' } | null;

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const tenantQuery = useMyTenantQuery();
  const tenant = tenantQuery.data;

  const employeeQuery = useTenantAdminEmployeeDetailQuery(tenant?.id, id);
  const employee = employeeQuery.data;
  // Reused for both the Reporting Manager option list and resolving the
  // current employee's own manager name on the Overview tab.
  const colleaguesQuery = useTenantAdminEmployeeListQuery(tenant?.id, { page: 1, pageSize: 100 });
  const colleagues = colleaguesQuery.data?.items ?? [];

  const reissueInvitation = useReissueInvitationMutation(tenant?.id ?? '');
  const [statusEmployee, setStatusEmployee] = useState<TenantEmployee | null>(null);
  const initialTab = isTabKey((location.state as { tab?: unknown } | null)?.tab)
    ? (location.state as { tab: TabKey }).tab
    : 'overview';
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const notify = (message: string, severity: 'success' | 'error' = 'success') => setFeedback({ message, severity });
  const goToList = () => navigate('/tenant-admin/employees');

  const handleResendInvite = async () => {
    if (!employee) return;
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

  if (tenantQuery.isLoading || employeeQuery.isLoading) return <LoadingState variant="card" />;

  if (tenantQuery.isError || !tenant) {
    return (
      <ErrorState
        message={tenantQuery.error?.message ?? 'Unable to load your tenant.'}
        onRetry={() => tenantQuery.refetch()}
      />
    );
  }

  if (employeeQuery.isError) {
    return <ErrorState message={employeeQuery.error.message} onRetry={() => employeeQuery.refetch()} />;
  }

  if (!employee) {
    return (
      <EmptyState
        title="Employee not found"
        description="This employee may have been removed."
        action={{ label: 'Back to employees', onClick: goToList }}
      />
    );
  }

  const manager = colleagues.find((c) => c.id === employee.reportingManagerId);
  const managerName = manager ? formatFullName(manager.firstName, manager.lastName) : null;

  return (
    <>
      <PageHeader
        title="Employee Details"
        description="View and manage employee profile, employment information and access."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Employees', path: '/tenant-admin/employees' },
          { label: formatFullName(employee.firstName, employee.lastName) },
        ]}
      />

      <EmployeeDetailHeader
        employee={employee}
        onBack={goToList}
        onResendInvite={handleResendInvite}
        resendInvitePending={reissueInvitation.isPending}
        onToggleStatus={() => setStatusEmployee(employee)}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs value={tab} onChange={(_event, value: TabKey) => setTab(value)}>
          {TABS.map((key) => (
            <Tab key={key} value={key} label={TAB_LABELS[key]} />
          ))}
        </Tabs>
      </Box>

      {tab === 'overview' && <EmployeeOverviewTab employee={employee} tenant={tenant} managerName={managerName} />}
      {tab === 'edit' && (
        <EmployeeEditTab
          tenant={tenant}
          employee={employee}
          managerOptions={colleagues}
          onSuccess={notify}
          onCancel={() => setTab('overview')}
        />
      )}
      {tab === 'permissions' && <EmployeePermissionsTab tenant={tenant} employee={employee} onSuccess={notify} />}

      <StatusConfirmDialog employee={statusEmployee} onClose={() => setStatusEmployee(null)} onSuccess={notify} />

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

export default EmployeeDetailPage;
