import type { ConditionExpression, FieldCondition, FieldPermissions } from '../schema.types';
import { get } from './paths';

function isConditionGroup(condition: ConditionExpression): condition is Extract<
  ConditionExpression,
  { all?: unknown; any?: unknown }
> {
  return 'all' in condition || 'any' in condition;
}

function evaluateSingle(condition: FieldCondition, values: Record<string, unknown>): boolean {
  const actual = get(values, condition.field);
  switch (condition.operator) {
    case 'eq':
      return actual === condition.value;
    case 'neq':
      return actual !== condition.value;
    case 'gt':
      return Number(actual) > Number(condition.value);
    case 'gte':
      return Number(actual) >= Number(condition.value);
    case 'lt':
      return Number(actual) < Number(condition.value);
    case 'lte':
      return Number(actual) <= Number(condition.value);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(actual);
    case 'notIn':
      return Array.isArray(condition.value) && !condition.value.includes(actual);
    case 'truthy':
      return Boolean(actual);
    case 'falsy':
      return !actual;
    case 'contains':
      if (Array.isArray(actual)) return actual.includes(condition.value);
      if (typeof actual === 'string') return actual.includes(String(condition.value));
      return false;
    default:
      return false;
  }
}

/** Evaluates a (possibly nested all/any) condition tree against the current form values. */
export function evaluateCondition(
  condition: ConditionExpression | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!condition) return false;
  if (isConditionGroup(condition)) {
    if (condition.all) return condition.all.every((c) => evaluateCondition(c, values));
    if (condition.any) return condition.any.some((c) => evaluateCondition(c, values));
    return false;
  }
  return evaluateSingle(condition, values);
}

export function isFieldVisibleForRole(permissions: FieldPermissions | undefined, role: string | undefined): boolean {
  if (!permissions?.roles || permissions.roles.length === 0) return true;
  return Boolean(role && permissions.roles.includes(role));
}

export function isFieldReadonlyForRole(permissions: FieldPermissions | undefined, role: string | undefined): boolean {
  if (!permissions?.readonlyRoles || !role) return false;
  return permissions.readonlyRoles.includes(role);
}
