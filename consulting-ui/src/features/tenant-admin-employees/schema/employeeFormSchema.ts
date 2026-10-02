import type { FormSchema, PermissionMatrixModuleDef } from '@/components/form-builder';

/** Standalone schema used by the Permissions tab — same field, same engine, no duplicate form. */
export function buildPermissionsOnlySchema(moduleRows: PermissionMatrixModuleDef[]): FormSchema {
  return {
    id: 'tenant-admin-employee-permissions',
    sections: [
      {
        id: 'permissions',
        layout: 'plain',
        fields: [
          {
            // Label intentionally blank — the Permissions tab already
            // renders its own "Permissions" heading above this field.
            type: 'permission_matrix',
            name: 'permissions',
            label: '',
            modules: moduleRows,
            grid: { xs: 12 },
          },
        ],
      },
    ],
  };
}
