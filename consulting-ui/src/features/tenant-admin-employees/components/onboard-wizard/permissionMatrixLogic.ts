import type { ModulePermission, PermissionAction } from '@/components/form-builder';

export const PERMISSION_MATRIX_ACTIONS: PermissionAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

// CREATE/UPDATE/DELETE each require READ — checking one auto-checks READ,
// unchecking READ clears every action that depends on it. Mirrors the
// server-side rule in employees/constants.py::PERMISSION_ACTION_REQUIRES.
const REQUIRES: Partial<Record<PermissionAction, PermissionAction>> = {
  CREATE: 'READ',
  UPDATE: 'READ',
  DELETE: 'READ',
};

export function actionsForModule(value: ModulePermission[], moduleKey: string): PermissionAction[] {
  return value.find((entry) => entry.module === moduleKey)?.actions ?? [];
}

export function withModuleActions(
  value: ModulePermission[],
  moduleKey: string,
  actions: PermissionAction[],
): ModulePermission[] {
  const next = value.filter((entry) => entry.module !== moduleKey);
  if (actions.length > 0) next.push({ module: moduleKey, actions });
  return next;
}

export function toggleModuleAction(
  value: ModulePermission[],
  moduleKey: string,
  action: PermissionAction,
  checked: boolean,
): ModulePermission[] {
  let actions = actionsForModule(value, moduleKey);
  if (checked) {
    actions = actions.includes(action) ? actions : [...actions, action];
    const requires = REQUIRES[action];
    if (requires && !actions.includes(requires)) actions = [...actions, requires];
  } else {
    actions = actions.filter((a) => a !== action);
    if (action === 'READ') {
      actions = actions.filter((a) => REQUIRES[a] !== 'READ');
    }
  }
  return withModuleActions(value, moduleKey, actions);
}
