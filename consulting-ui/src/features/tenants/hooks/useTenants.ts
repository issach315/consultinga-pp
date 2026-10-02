import { useMemo } from 'react';
import { useDataTableState } from '@/components/data-table';
import { useTenantListQuery } from '../api/tenantQueries';
import type { TenantPlanId } from '../constants/plans';
import type { TenantTypeId } from '../constants/tenantType';

export interface TenantFilters {
  isActive?: boolean;
  plan?: TenantPlanId;
  tenantType?: TenantTypeId;
}

export function useTenants(filters: TenantFilters = {}) {
  const tableState = useDataTableState({ initialPageSize: 25 });

  const queryParams = useMemo(
    () => ({
      page: tableState.queryParams.page,
      pageSize: tableState.queryParams.pageSize,
      search: tableState.queryParams.search,
      isActive: filters.isActive,
      plan: filters.plan,
      tenantType: filters.tenantType,
    }),
    [tableState.queryParams, filters.isActive, filters.plan, filters.tenantType],
  );

  const tenantsQuery = useTenantListQuery(queryParams);

  return {
    tableState,
    tenantsQuery,
  };
}
