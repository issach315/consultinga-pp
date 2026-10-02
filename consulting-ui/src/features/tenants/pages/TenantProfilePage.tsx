import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState } from '@/components/common';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ApiError } from '@/types';
import { useDeleteTenantMutation, useSetTenantActiveMutation, useTenantDetailQuery } from '../api/tenantQueries';
import { useTenantEmployees } from '../hooks/useTenantEmployees';
import { TenantProfileHeader } from '../components/profile/TenantProfileHeader';
import { TenantOverviewTab } from '../components/profile/TenantOverviewTab';
import { CompanyDetailsSection } from '../components/profile/CompanyDetailsSection';
import { TenantAdminSection } from '../components/profile/TenantAdminSection';
import { PlanConfigurationSection } from '../components/profile/PlanConfigurationSection';
import { TenantModulesSection } from '../components/profile/TenantModulesSection';
import { TenantEmployeesTab } from '../components/profile/TenantEmployeesTab';

const TABS = ['overview', 'company', 'admin', 'plan', 'modules', 'employees'] as const;
type TabKey = (typeof TABS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  company: 'Company',
  admin: 'Admin',
  plan: 'Plan & Config',
  modules: 'Modules',
  employees: 'Employees',
};

export function TenantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.roles.some((role) => role.code === 'SUPER_ADMIN') ?? false;

  const [tab, setTab] = useState<TabKey>('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const tenantQuery = useTenantDetailQuery(id);
  const { employeesQuery } = useTenantEmployees(id);
  const setActive = useSetTenantActiveMutation();
  const deleteTenant = useDeleteTenantMutation();

  const tenant = tenantQuery.data;
  const employeeCount = employeesQuery.data?.meta.totalItems;

  const handleToggleActive = async () => {
    if (!tenant) return;
    try {
      await setActive.mutateAsync({ id: tenant.id, isActive: !tenant.isActive });
      setFeedback(tenant.isActive ? 'Tenant deactivated.' : 'Tenant activated.');
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : 'Unable to update tenant status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!tenant) return;
    try {
      await deleteTenant.mutateAsync(tenant.id);
      navigate('/tenants', { replace: true, state: { successMessage: `Tenant "${tenant.legalCompanyName}" deleted.` } });
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : 'Unable to delete tenant.');
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Tenants', path: '/tenants' },
          { label: tenant?.legalCompanyName ?? 'Tenant' },
        ]}
      />

      {tenantQuery.isLoading && <LoadingState variant="card" />}

      {tenantQuery.isError && (
        <ErrorState message={tenantQuery.error.message} onRetry={() => tenantQuery.refetch()} />
      )}

      {tenantQuery.isSuccess && !tenant && (
        <EmptyState
          title="Tenant not found"
          description="This tenant may have been deleted."
          action={{ label: 'Back to tenants', onClick: () => navigate('/tenants') }}
        />
      )}

      {tenant && (
        <>
          <TenantProfileHeader
            tenant={tenant}
            canManage={canManage}
            onEdit={() => navigate(`/tenants/${tenant.id}/edit`)}
            onToggleActive={handleToggleActive}
            toggleActivePending={setActive.isPending}
            onDeleteRequest={() => setConfirmDelete(true)}
          />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tab}
              onChange={(_event, value: TabKey) => setTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {TABS.map((key) => (
                <Tab key={key} value={key} label={TAB_LABELS[key]} />
              ))}
            </Tabs>
          </Box>

          {tab === 'overview' && (
            <TenantOverviewTab tenant={tenant} employeeCount={employeeCount} employeeCountLoading={employeesQuery.isLoading} />
          )}
          {tab === 'company' && (
            <CompanyDetailsSection tenant={tenant} canManage={canManage} onEdit={() => navigate(`/tenants/${tenant.id}/edit`)} />
          )}
          {tab === 'admin' && (
            <TenantAdminSection
              tenant={tenant}
              canManage={canManage}
              onEdit={() => navigate(`/tenants/${tenant.id}/edit`)}
              onToggleActive={handleToggleActive}
              toggleActivePending={setActive.isPending}
            />
          )}
          {tab === 'plan' && (
            <PlanConfigurationSection tenant={tenant} employeeCount={employeeCount} employeeCountLoading={employeesQuery.isLoading} />
          )}
          {tab === 'modules' && <TenantModulesSection tenant={tenant} canManage={canManage} />}
          {tab === 'employees' && <TenantEmployeesTab tenantId={tenant.id} />}
        </>
      )}

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete tenant?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently removes "{tenant?.legalCompanyName}" and its tenant admin account. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} disabled={deleteTenant.isPending}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} loading={deleteTenant.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        message={feedback}
      />
    </>
  );
}

export default TenantProfilePage;
