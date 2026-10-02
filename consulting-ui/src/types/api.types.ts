export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiErrorPayload {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.status = payload.status;
    this.errors = payload.errors;
  }
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

export type ListQueryParams = PaginationParams &
  SortParams &
  FilterParams & {
    search?: string;
  };
