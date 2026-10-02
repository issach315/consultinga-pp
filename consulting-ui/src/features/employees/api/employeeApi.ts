import { apiClient } from '@/services/api/client';
import { employeeEndpoints } from '@/services/api/endpoints';
import type { PaginatedResponse } from '@/types';
import type {
  CreateEmployeePayload,
  Employee,
  EmployeeListParams,
  UpdateEmployeePayload,
} from '../types/employee.types';

export const employeeApi = {
  async list(params: EmployeeListParams): Promise<PaginatedResponse<Employee>> {
    const { tenantId, ...rest } = params;
    const { data } = await apiClient.get<PaginatedResponse<Employee>>(employeeEndpoints.list, {
      params: { ...rest, tenant_id: tenantId },
    });
    return data;
  },

  async getById(id: string): Promise<Employee> {
    const { data } = await apiClient.get<Employee>(employeeEndpoints.detail(id));
    return data;
  },

  async create(payload: CreateEmployeePayload): Promise<Employee> {
    const { data } = await apiClient.post<Employee>(employeeEndpoints.list, payload);
    return data;
  },

  async update(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    const { data } = await apiClient.patch<Employee>(employeeEndpoints.detail(id), payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(employeeEndpoints.detail(id));
  },
};
