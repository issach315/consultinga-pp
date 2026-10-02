/**
 * The entire form-builder is driven by these types. A new form is a new
 * FormSchema value — nothing here should ever need to change to support it.
 */

import type { CountryCode } from '@/components/phone-number-field';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'password'
  | 'number'
  | 'currency'
  | 'phone'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'autocomplete'
  | 'multiAutocomplete'
  | 'asyncSelect'
  | 'fileUpload'
  | 'repeater'
  | 'permission_matrix'
  | 'heading'
  | 'paragraph'
  | 'divider'
  | 'hidden'
  | 'readonly';

export interface GridSize {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'truthy'
  | 'falsy'
  | 'contains';

export interface FieldCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface ConditionGroup {
  all?: ConditionExpression[];
  any?: ConditionExpression[];
}

/** A leaf condition, or an all/any group of conditions — nests to any depth. */
export type ConditionExpression = FieldCondition | ConditionGroup;

export interface FieldPermissions {
  /** If set, only these roles see the field at all. Omit to allow everyone. */
  roles?: string[];
  /** Roles that see the field but can't edit it. */
  readonlyRoles?: string[];
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface AsyncOptionsConfig {
  /** GET endpoint, relative to the app's apiClient baseURL. */
  url: string;
  /** Query param the typed search term is sent under. */
  searchParam?: string;
  /** Response item key mapped to the option value. */
  valueKey?: string;
  /** Response item key mapped to the option label. */
  labelKey?: string;
  /** Name of the field this select depends on — reloads options when it changes. */
  dependsOn?: string;
  /** Query param the parent field's value is sent under. */
  dependsOnParam?: string;
  /** Don't query until the search term reaches this length. */
  minSearchLength?: number;
  debounceMs?: number;
}

export interface ValidationRules {
  required?: boolean;
  requiredMessage?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  /** Regex source (no slashes/flags). */
  pattern?: string;
  patternMessage?: string;
}

interface BaseFieldSchema {
  type: FieldType;
  /** Dot-path into the form values, e.g. "address.city" or "experience.0.company". */
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  defaultValue?: unknown;
  grid?: GridSize;
  validation?: ValidationRules;
  /** Field renders only while this condition is true. */
  showWhen?: ConditionExpression;
  /** Field is removed from view while this condition is true (takes precedence over showWhen). */
  hideWhen?: ConditionExpression;
  /** Field renders disabled while this condition is true. */
  disableWhen?: ConditionExpression;
  /** Field becomes required (cross-field, enforced via Zod superRefine) while this condition is true. */
  requiredWhen?: ConditionExpression;
  permissions?: FieldPermissions;
  disabled?: boolean;
  readonly?: boolean;
}

export interface TextFieldSchema extends BaseFieldSchema {
  type: 'text' | 'email' | 'password' | 'url' | 'number' | 'currency' | 'textarea';
  rows?: number;
  currencyCode?: string;
  startAdornment?: string;
  endAdornment?: string;
}

/** Renders the shared global PhoneNumberField (flag/name/dial-code selector + numeric-only input). */
export interface PhoneFieldSchema extends BaseFieldSchema {
  type: 'phone';
  defaultCountry?: CountryCode;
}

export interface DateFieldSchema extends BaseFieldSchema {
  type: 'date' | 'time' | 'datetime';
  minDate?: string;
  maxDate?: string;
}

export interface BooleanFieldSchema extends BaseFieldSchema {
  type: 'checkbox' | 'switch';
}

export interface OptionsFieldSchema extends BaseFieldSchema {
  type: 'radio' | 'select' | 'multiselect' | 'autocomplete' | 'multiAutocomplete';
  options: SelectOption[];
  /** Autocomplete only — lets the user enter a value not in the option list. */
  freeSolo?: boolean;
}

export interface AsyncSelectFieldSchema extends BaseFieldSchema {
  type: 'asyncSelect';
  multiple?: boolean;
  async: AsyncOptionsConfig;
}

export interface FileUploadFieldSchema extends BaseFieldSchema {
  type: 'fileUpload';
  /** e.g. ".png,.jpg,.pdf" */
  accept?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
  /** POST endpoint; expected to respond with { url, key }. Omit to store raw File objects only. */
  uploadUrl?: string;
}

export interface RepeaterFieldSchema extends BaseFieldSchema {
  type: 'repeater';
  /** e.g. "Experience" -> rendered as "Experience #1", "Experience #2" ... */
  itemLabel?: string;
  minItems?: number;
  maxItems?: number;
  /** Schema for one item's fields — names are relative to the item, e.g. "company". */
  fields: FieldSchema[];
}

export interface StaticFieldSchema extends BaseFieldSchema {
  type: 'heading' | 'paragraph' | 'divider' | 'hidden' | 'readonly';
  content?: string;
  level?: 1 | 2 | 3 | 4;
}

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

export interface ModulePermission {
  module: string;
  actions: PermissionAction[];
}

export interface PermissionMatrixModuleDef {
  key: string;
  name: string;
}

/**
 * Renders a module × action (CREATE/READ/UPDATE/DELETE) checkbox grid.
 * Value is `ModulePermission[]` — one entry per module with at least one
 * action selected. CREATE/UPDATE/DELETE imply READ (fixed dependency rule).
 */
export interface PermissionMatrixFieldSchema extends BaseFieldSchema {
  type: 'permission_matrix';
  /** Row set — typically the tenant's enabled modules. */
  modules: PermissionMatrixModuleDef[];
  /** Starts collapsed behind a one-line summary until the admin opts to customize. */
  collapsedByDefault?: boolean;
  /** Name of a sibling field (relative to this one, e.g. "role") whose value picks a default permission set. */
  roleFieldName?: string;
  /** roleValue -> its default grants. Applied once, only while this field is still empty. */
  defaultsByRole?: Record<string, ModulePermission[]>;
}

export type FieldSchema =
  | TextFieldSchema
  | PhoneFieldSchema
  | DateFieldSchema
  | BooleanFieldSchema
  | OptionsFieldSchema
  | AsyncSelectFieldSchema
  | FileUploadFieldSchema
  | RepeaterFieldSchema
  | PermissionMatrixFieldSchema
  | StaticFieldSchema;

export type SectionLayout = 'card' | 'accordion' | 'plain';

export interface SectionSchema {
  id: string;
  title?: string;
  description?: string;
  layout?: SectionLayout;
  fields: FieldSchema[];
  showWhen?: ConditionExpression;
  permissions?: FieldPermissions;
}

export interface StepSchema {
  id: string;
  title: string;
  description?: string;
  sections: SectionSchema[];
}

export interface FormSchema {
  id: string;
  title?: string;
  /** Single-page mode. */
  sections?: SectionSchema[];
  /** Stepper mode. */
  steps?: StepSchema[];
  /** Set to enable localStorage autosave + resume, keyed by this string. */
  persistKey?: string;
}
