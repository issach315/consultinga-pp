import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Checkbox,
  Chip,
  FormHelperText,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useController, useFormContext } from 'react-hook-form';
import { get } from '../engine/paths';
import { useFieldState } from '../engine/useFieldState';
import type { ModulePermission, PermissionAction, PermissionMatrixFieldSchema } from '../schema.types';
import type { FieldRendererProps } from './fieldTypes';

const ACTIONS: PermissionAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

// CREATE/UPDATE/DELETE each require READ — checking one auto-checks READ,
// unchecking READ clears every action that depends on it.
const REQUIRES: Partial<Record<PermissionAction, PermissionAction>> = {
  CREATE: 'READ',
  UPDATE: 'READ',
  DELETE: 'READ',
};

function actionsFor(value: ModulePermission[], moduleKey: string): PermissionAction[] {
  return value.find((entry) => entry.module === moduleKey)?.actions ?? [];
}

function withModuleActions(value: ModulePermission[], moduleKey: string, actions: PermissionAction[]): ModulePermission[] {
  const next = value.filter((entry) => entry.module !== moduleKey);
  if (actions.length > 0) next.push({ module: moduleKey, actions });
  return next;
}

function toggleAction(
  value: ModulePermission[],
  moduleKey: string,
  action: PermissionAction,
  checked: boolean,
): ModulePermission[] {
  let actions = actionsFor(value, moduleKey);
  if (checked) {
    actions = actions.includes(action) ? actions : [...actions, action];
    const requires = REQUIRES[action];
    if (requires && !actions.includes(requires)) actions = [...actions, requires];
  } else {
    actions = actions.filter((a) => a !== action);
    if (action === 'READ') {
      // Everything that requires READ is dropped along with it.
      actions = actions.filter((a) => REQUIRES[a] !== 'READ');
    }
  }
  return withModuleActions(value, moduleKey, actions);
}

function totalCount(value: ModulePermission[]): number {
  return value.reduce((sum, entry) => sum + entry.actions.length, 0);
}

/** "employees.0.permissions" + "role" -> "employees.0.role" — resolves a sibling field within the same repeater row (or top-level). */
function siblingFieldName(fieldName: string, siblingName: string): string {
  const parts = fieldName.split('.');
  parts[parts.length - 1] = siblingName;
  return parts.join('.');
}

export function PermissionMatrixField({ field }: FieldRendererProps<PermissionMatrixFieldSchema>) {
  const { control, watch } = useFormContext();
  const { disabled, error } = useFieldState(field);
  const { field: rhfField } = useController({ name: field.name, control });
  const value: ModulePermission[] = useMemo(() => rhfField.value ?? [], [rhfField.value]);

  const roleFieldName = field.roleFieldName ? siblingFieldName(field.name, field.roleFieldName) : undefined;
  // Only this field needs to re-render when the sibling role changes, but
  // watching everything is the same pattern already used elsewhere in this
  // engine (useFieldState, ConditionalFieldRenderer) — keeps this simple.
  const allValues = roleFieldName ? (watch() as Record<string, unknown>) : undefined;
  const roleValue = roleFieldName ? (get(allValues, roleFieldName) as string | undefined) : undefined;

  const appliedForRole = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!field.defaultsByRole || !roleValue || value.length > 0) return;
    if (appliedForRole.current === roleValue) return;
    const defaults = field.defaultsByRole[roleValue];
    if (defaults && defaults.length > 0) {
      appliedForRole.current = roleValue;
      rhfField.onChange(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the watched role changes
  }, [roleValue]);

  const [expanded, setExpanded] = useState(!field.collapsedByDefault);

  // "Module Access" is a per-row gate independent of which actions are
  // checked — switching it on unlocks the row's checkboxes without granting
  // anything by itself; switching it off locks the row and clears its
  // actions. A module already carrying actions (existing data, role
  // defaults, Select all) always starts/stays unlocked.
  const [unlockedModules, setUnlockedModules] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(field.modules.map((module) => [module.key, actionsFor(value, module.key).length > 0])),
  );
  useEffect(() => {
    setUnlockedModules((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const module of field.modules) {
        if (actionsFor(value, module.key).length > 0 && !next[module.key]) {
          next[module.key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [value, field.modules]);

  const selectAll = () => rhfField.onChange(field.modules.map((module) => ({ module: module.key, actions: [...ACTIONS] })));
  const clearAll = () => rhfField.onChange([]);
  const selectAllForModule = (moduleKey: string) => rhfField.onChange(withModuleActions(value, moduleKey, [...ACTIONS]));
  const clearAllForModule = (moduleKey: string) => rhfField.onChange(withModuleActions(value, moduleKey, []));
  const handleToggle = (moduleKey: string, action: PermissionAction, checked: boolean) =>
    rhfField.onChange(toggleAction(value, moduleKey, action, checked));
  const handleModuleAccessToggle = (moduleKey: string, checked: boolean) => {
    setUnlockedModules((prev) => ({ ...prev, [moduleKey]: checked }));
    if (!checked) rhfField.onChange(withModuleActions(value, moduleKey, []));
  };

  const count = totalCount(value);
  const summaryModules = value.filter((entry) => entry.actions.length > 0).map((entry) => entry.module);

  return (
    <Box>
      {field.label && (
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {field.label}
          </Typography>
          {expanded && (
            <Typography variant="caption" color="text.secondary">
              {count} permission{count === 1 ? '' : 's'} selected
            </Typography>
          )}
        </Stack>
      )}

      {!expanded ? (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {count === 0 ? (
            <Typography variant="body2" color="text.disabled">
              No permissions yet
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                {count} permission{count === 1 ? '' : 's'} across {summaryModules.length} module
                {summaryModules.length === 1 ? '' : 's'}
                {appliedForRole.current ? ` — using defaults` : ''}
              </Typography>
            </>
          )}
          <Chip
            label="Customize"
            size="small"
            variant="outlined"
            onClick={() => setExpanded(true)}
            disabled={disabled}
            sx={{ cursor: disabled ? 'default' : 'pointer' }}
          />
        </Stack>
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Module</TableCell>
                <TableCell align="center">Module Access</TableCell>
                {ACTIONS.map((action) => (
                  <TableCell key={action} align="center">
                    {action.charAt(0) + action.slice(1).toLowerCase()}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <Box
                    component="button"
                    type="button"
                    onClick={selectAll}
                    disabled={disabled}
                    sx={{
                      border: 'none',
                      background: 'none',
                      color: 'primary.main',
                      cursor: disabled ? 'default' : 'pointer',
                      font: 'inherit',
                      fontSize: '0.75rem',
                      p: 0,
                      mr: 1.5,
                    }}
                  >
                    Select all
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={clearAll}
                    disabled={disabled}
                    sx={{
                      border: 'none',
                      background: 'none',
                      color: 'text.secondary',
                      cursor: disabled ? 'default' : 'pointer',
                      font: 'inherit',
                      fontSize: '0.75rem',
                      p: 0,
                    }}
                  >
                    Clear all
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {field.modules.map((module) => {
                const moduleActions = actionsFor(value, module.key);
                const unlocked = Boolean(unlockedModules[module.key]);
                const rowDisabled = disabled || !unlocked;
                return (
                  <TableRow key={module.key}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={unlocked ? 700 : 400}
                        color={unlocked ? 'text.primary' : 'text.disabled'}
                      >
                        {module.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={unlocked}
                        disabled={disabled}
                        onChange={(event) => handleModuleAccessToggle(module.key, event.target.checked)}
                        inputProps={{ 'aria-label': `${module.name} module access` }}
                      />
                    </TableCell>
                    {ACTIONS.map((action) => (
                      <TableCell key={action} align="center">
                        <Checkbox
                          size="small"
                          checked={moduleActions.includes(action)}
                          disabled={rowDisabled}
                          onChange={(event) => handleToggle(module.key, action, event.target.checked)}
                          inputProps={{ 'aria-label': `${module.name} ${action}` }}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Box
                        component="button"
                        type="button"
                        onClick={() => selectAllForModule(module.key)}
                        disabled={rowDisabled}
                        sx={{
                          border: 'none',
                          background: 'none',
                          color: rowDisabled ? 'text.disabled' : 'primary.main',
                          cursor: rowDisabled ? 'default' : 'pointer',
                          font: 'inherit',
                          fontSize: '0.75rem',
                          p: 0,
                          mr: 1.5,
                        }}
                      >
                        All
                      </Box>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => clearAllForModule(module.key)}
                        disabled={rowDisabled}
                        sx={{
                          border: 'none',
                          background: 'none',
                          color: 'text.secondary',
                          cursor: rowDisabled ? 'default' : 'pointer',
                          font: 'inherit',
                          fontSize: '0.75rem',
                          p: 0,
                          opacity: rowDisabled ? 0.5 : 1,
                        }}
                      >
                        None
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {field.collapsedByDefault && (
            <Box sx={{ mt: 1 }}>
              <Chip label="Collapse" size="small" variant="outlined" onClick={() => setExpanded(false)} disabled={disabled} />
            </Box>
          )}
        </>
      )}

      {(error?.message ?? field.description) && (
        <FormHelperText error={Boolean(error)}>{error?.message ?? field.description}</FormHelperText>
      )}
    </Box>
  );
}
