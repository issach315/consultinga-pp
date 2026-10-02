import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import type { GridRowSelectionModel } from '@mui/x-data-grid';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { BulkActionBar, FilterDrawer } from '@/components/data-table';
import { ApiError } from '@/types';
import { exportRowsToCsv } from '@/utils/exportCsv';
import { useTenants } from '../hooks/useTenants';
import { TenantTable } from '../components/TenantTable';
import { useDeleteTenantMutation, useSetTenantActiveMutation } from '../api/tenantQueries';
import { PLAN_DEFS, type TenantPlanId } from '../constants/plans';
import { TENANT_TYPE_OPTIONS, type TenantTypeId } from '../constants/tenantType';
import type { TenantListItem } from '../types/tenant.types';

type StatusFilter = 'all' | 'active' | 'inactive';

interface TenantFilterState {
  status: StatusFilter;
  plan: TenantPlanId | '';
  tenantType: TenantTypeId | '';
}

const EMPTY_FILTERS: TenantFilterState = { status: 'all', plan: '', tenantType: '' };

function countActiveFilters(filters: TenantFilterState): number {
  return [filters.status !== 'all', filters.plan !== '', filters.tenantType !== ''].filter(Boolean).length;
}

export function TenantsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appliedFilters, setAppliedFilters] = useState<TenantFilterState>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<TenantFilterState>(EMPTY_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const { tableState, tenantsQuery } = useTenants({
    isActive: appliedFilters.status === 'all' ? undefined : appliedFilters.status === 'active',
    plan: appliedFilters.plan || undefined,
    tenantType: appliedFilters.tenantType || undefined,
  });
  const deleteTenant = useDeleteTenantMutation();
  const setActive = useSetTenantActiveMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ?? null,
  );
  const [tenantToDelete, setTenantToDelete] = useState<TenantListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [bulkPending, setBulkPending] = useState(false);

  const rows = tenantsQuery.data?.items ?? [];
  const selectedIds = selectionModel.map(String);
  const selectedRows = rows.filter((row) => selectedIds.includes(row.id));

  const openFilterDrawer = () => {
    setDraftFilters(appliedFilters);
    setFilterDrawerOpen(true);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setSelectionModel([]);
    tableState.setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSelectionModel([]);
    tableState.setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const closeDeleteDialog = () => {
    setTenantToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!tenantToDelete) return;
    setDeleteError(null);
    try {
      await deleteTenant.mutateAsync(tenantToDelete.id);
      setSuccessMessage(`Tenant "${tenantToDelete.legalCompanyName}" deleted.`);
      setTenantToDelete(null);
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : 'Unable to delete tenant.');
    }
  };

  const handleBulkSetActive = async (isActive: boolean) => {
    setBulkPending(true);
    try {
      await Promise.all(selectedIds.map((id) => setActive.mutateAsync({ id, isActive })));
      setSuccessMessage(`${selectedIds.length} tenant(s) ${isActive ? 'activated' : 'deactivated'}.`);
      setSelectionModel([]);
    } catch (error) {
      setSuccessMessage(error instanceof ApiError ? error.message : 'Some tenants could not be updated.');
    } finally {
      setBulkPending(false);
    }
  };

  const handleBulkExport = () => {
    exportRowsToCsv(
      selectedRows.map((tenant) => ({
        Company: tenant.legalCompanyName,
        'Tenant Code': tenant.tenantCode,
        Plan: tenant.plan,
        'Employee Limit': tenant.employeeLimit,
        'Admin Email': tenant.adminEmail,
        Status: tenant.isActive ? 'Active' : 'Inactive',
        Created: tenant.createdAt,
      })),
      'tenants.csv',
    );
  };

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Manage tenant organizations within this SaaS instance."
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Tenants' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tenants/new')}>
            New tenant
          </Button>
        }
      />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectionModel([])}
        actions={[
          { label: 'Activate', onClick: () => handleBulkSetActive(true), loading: bulkPending },
          { label: 'Deactivate', onClick: () => handleBulkSetActive(false), loading: bulkPending },
          { label: 'Export', onClick: handleBulkExport },
        ]}
      />

      <TenantTable
        rows={rows}
        rowCount={tenantsQuery.data?.meta.totalItems ?? 0}
        loading={tenantsQuery.isLoading || tenantsQuery.isFetching}
        error={tenantsQuery.error}
        onRetry={() => tenantsQuery.refetch()}
        tableState={tableState}
        onDelete={setTenantToDelete}
        selectionModel={selectionModel}
        onSelectionModelChange={setSelectionModel}
        toolbarFilters={
          <Badge badgeContent={countActiveFilters(appliedFilters)} color="primary">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon fontSize="small" />}
              onClick={openFilterDrawer}
              sx={{ height: 34 }}
            >
              Filters
            </Button>
          </Badge>
        }
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={applyFilters}
        onClear={clearFilters}
      >
        <FormControl>
          <FormLabel sx={{ mb: 1, fontWeight: 600, fontSize: '0.8rem' }}>Status</FormLabel>
          <RadioGroup
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, status: event.target.value as StatusFilter }))
            }
          >
            <FormControlLabel value="all" control={<Radio size="small" />} label="All tenants" />
            <FormControlLabel value="active" control={<Radio size="small" />} label="Active" />
            <FormControlLabel value="inactive" control={<Radio size="small" />} label="Inactive" />
          </RadioGroup>
        </FormControl>

        <TextField
          select
          label="Plan"
          value={draftFilters.plan}
          onChange={(event) =>
            setDraftFilters((prev) => ({ ...prev, plan: event.target.value as TenantPlanId | '' }))
          }
          fullWidth
        >
          <MenuItem value="">Any plan</MenuItem>
          {PLAN_DEFS.map((plan) => (
            <MenuItem key={plan.id} value={plan.id}>
              {plan.id}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Tenant type"
          value={draftFilters.tenantType}
          onChange={(event) =>
            setDraftFilters((prev) => ({ ...prev, tenantType: event.target.value as TenantTypeId | '' }))
          }
          fullWidth
        >
          <MenuItem value="">Any type</MenuItem>
          {TENANT_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </FilterDrawer>

      <Dialog open={Boolean(tenantToDelete)} onClose={closeDeleteDialog}>
        <DialogTitle>Delete tenant?</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            This permanently removes "{tenantToDelete?.legalCompanyName}" and its tenant admin
            account. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteTenant.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            loading={deleteTenant.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </>
  );
}

export default TenantsPage;
