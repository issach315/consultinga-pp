export type CompanyType =
  | 'PRIVATE_LIMITED'
  | 'PUBLIC_LIMITED'
  | 'LLP'
  | 'PARTNERSHIP'
  | 'SOLE_PROPRIETORSHIP'
  | 'GOVERNMENT'
  | 'NON_PROFIT'
  | 'OTHER';

export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export interface ClientCreator {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  tenantId: string;
  clientCode: string;
  companyName: string;
  companyType: CompanyType;
  industry: string | null;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string | null;
  designation: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: ClientStatus;
  notes: string | null;
  createdBy: string;
  onboardedBy: ClientCreator;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ClientListParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: ClientStatus;
}

export interface ClientPayload {
  companyName: string;
  companyType: CompanyType;
  industry?: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone?: string;
  designation?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status: ClientStatus;
  notes?: string;
}

export type UpdateClientPayload = Partial<ClientPayload>;

export const COMPANY_TYPE_OPTIONS: Array<{ value: CompanyType; label: string }> = [
  { value: 'PRIVATE_LIMITED', label: 'Private Limited' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited' },
  { value: 'LLP', label: 'Limited Liability Partnership' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'NON_PROFIT', label: 'Non-profit' },
  { value: 'OTHER', label: 'Other' },
];
