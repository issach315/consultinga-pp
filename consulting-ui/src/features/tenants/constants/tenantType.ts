// Mirrors consulting-api/app/modules/tenants/constants.py TenantType.
export type TenantTypeId = 'Domestic' | 'US IT' | 'Hybrid';

export const TENANT_TYPE_OPTIONS: { id: TenantTypeId; label: string }[] = [
  { id: 'Domestic', label: 'Domestic' },
  { id: 'US IT', label: 'US IT' },
  { id: 'Hybrid', label: 'Hybrid' },
];
