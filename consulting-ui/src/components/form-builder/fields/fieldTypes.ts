import type { FieldSchema } from '../schema.types';

export interface FieldRendererProps<T extends FieldSchema = FieldSchema> {
  field: T;
  role?: string;
}
