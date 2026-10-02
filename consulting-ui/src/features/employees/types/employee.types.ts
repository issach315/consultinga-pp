export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  status: EmployeeStatus;
  hireDate: string;
  salary: number;
}

export interface EmployeeListParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: EmployeeStatus;
  department?: string;
  tenantId?: string;
}

export type CreateEmployeePayload = Omit<Employee, 'id'>;
export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;
