import { apiClient } from '@/services/api/client';
import { clientEndpoints } from '@/services/api/endpoints';
import type { PaginatedResponse } from '@/types';
import type {
  Client,
  ClientListParams,
  ClientPayload,
  ClientStatus,
  CompanyType,
  UpdateClientPayload,
} from '../types/client.types';

interface ClientDto {
  id: string;
  tenant_id: string;
  client_code: string;
  company_name: string;
  company_type: CompanyType;
  industry: string | null;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string | null;
  designation: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  status: ClientStatus;
  notes: string | null;
  created_by: string;
  onboarded_by: { id: string; name: string; email: string };
  updated_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface PaginatedClientDto {
  items: ClientDto[];
  meta: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

function toClient(dto: ClientDto): Client {
  return {
    id: dto.id,
    tenantId: dto.tenant_id,
    clientCode: dto.client_code,
    companyName: dto.company_name,
    companyType: dto.company_type,
    industry: dto.industry,
    contactPersonName: dto.contact_person_name,
    contactPersonEmail: dto.contact_person_email,
    contactPersonPhone: dto.contact_person_phone,
    designation: dto.designation,
    website: dto.website,
    address: dto.address,
    city: dto.city,
    state: dto.state,
    country: dto.country,
    postalCode: dto.postal_code,
    status: dto.status,
    notes: dto.notes,
    createdBy: dto.created_by,
    onboardedBy: dto.onboarded_by,
    updatedBy: dto.updated_by,
    deletedBy: dto.deleted_by,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    deletedAt: dto.deleted_at,
  };
}

function toPayload(payload: UpdateClientPayload) {
  return {
    company_name: payload.companyName,
    company_type: payload.companyType,
    industry: payload.industry || null,
    contact_person_name: payload.contactPersonName,
    contact_person_email: payload.contactPersonEmail,
    contact_person_phone: payload.contactPersonPhone || null,
    designation: payload.designation || null,
    website: payload.website || null,
    address: payload.address || null,
    city: payload.city || null,
    state: payload.state || null,
    country: payload.country || null,
    postal_code: payload.postalCode || null,
    status: payload.status,
    notes: payload.notes || null,
  };
}

export const clientApi = {
  async list(params: ClientListParams): Promise<PaginatedResponse<Client>> {
    const { pageSize, sortBy, sortOrder, ...filters } = params;
    const { data } = await apiClient.get<PaginatedClientDto>(clientEndpoints.list, {
      params: {
        ...filters,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    });
    return {
      items: data.items.map(toClient),
      meta: {
        page: data.meta.page,
        pageSize: data.meta.page_size,
        totalItems: data.meta.total_items,
        totalPages: data.meta.total_pages,
      },
    };
  },

  async create(payload: ClientPayload): Promise<Client> {
    const { data } = await apiClient.post<ClientDto>(clientEndpoints.create, toPayload(payload));
    return toClient(data);
  },

  async update(clientId: string, payload: UpdateClientPayload): Promise<Client> {
    const { data } = await apiClient.patch<ClientDto>(
      clientEndpoints.update(clientId),
      toPayload(payload),
    );
    return toClient(data);
  },

  async remove(clientId: string): Promise<void> {
    await apiClient.delete(clientEndpoints.remove(clientId));
  },
};
