import { memo, type ComponentType } from 'react';
import { useFormContext } from 'react-hook-form';
import { evaluateCondition, isFieldVisibleForRole } from './engine/conditions';
import { AsyncSelectField } from './fields/AsyncSelectField';
import { AutocompleteField } from './fields/AutocompleteField';
import { CheckboxField, SwitchField } from './fields/BooleanFields';
import { DateField } from './fields/DateField';
import type { FieldRendererProps } from './fields/fieldTypes';
import { FileUploadField } from './fields/FileUploadField';
import { PermissionMatrixField } from './fields/PermissionMatrixField';
import { PhoneField } from './fields/PhoneField';
import { RadioGroupField } from './fields/RadioGroupField';
import { RepeaterField } from './fields/RepeaterField';
import { SelectField } from './fields/SelectField';
import { DividerField, HeadingField, HiddenField, ParagraphField, ReadonlyField } from './fields/StaticFields';
import { TextInputField } from './fields/TextInputField';
import type { RepeaterFieldSchema } from './schema.types';

// One entry per FieldType (minus 'repeater', which is special-cased below to
// avoid a circular import between this file and RepeaterField).
const registry: Record<string, ComponentType<FieldRendererProps<never>>> = {
  text: TextInputField,
  email: TextInputField,
  password: TextInputField,
  url: TextInputField,
  phone: PhoneField,
  number: TextInputField,
  currency: TextInputField,
  textarea: TextInputField,
  select: SelectField,
  multiselect: SelectField,
  autocomplete: AutocompleteField,
  multiAutocomplete: AutocompleteField,
  asyncSelect: AsyncSelectField,
  checkbox: CheckboxField,
  switch: SwitchField,
  radio: RadioGroupField,
  date: DateField,
  time: DateField,
  datetime: DateField,
  fileUpload: FileUploadField,
  permission_matrix: PermissionMatrixField,
  heading: HeadingField,
  paragraph: ParagraphField,
  divider: DividerField,
  readonly: ReadonlyField,
  hidden: HiddenField,
};

function FieldRendererInner({ field, role }: FieldRendererProps) {
  if (!isFieldVisibleForRole(field.permissions, role)) return null;

  if (field.type === 'repeater') {
    return <RepeaterField field={field as RepeaterFieldSchema} role={role} renderField={FieldRenderer} />;
  }

  const Component = registry[field.type];
  if (!Component) {
    if (import.meta.env.DEV) {
      console.warn(`FormBuilder: no renderer registered for field type "${field.type}"`);
    }
    return null;
  }
  return <Component field={field as never} role={role} />;
}

/** Only subscribes to form values (re-rendering on every change) when the field actually needs to. */
function ConditionalFieldRenderer({ field, role }: FieldRendererProps) {
  const { watch } = useFormContext();
  const values = watch() as Record<string, unknown>;
  if (field.hideWhen && evaluateCondition(field.hideWhen, values)) return null;
  if (field.showWhen && !evaluateCondition(field.showWhen, values)) return null;
  return <FieldRendererInner field={field} role={role} />;
}

export const FieldRenderer = memo(function FieldRenderer({ field, role }: FieldRendererProps) {
  if (field.hideWhen || field.showWhen) {
    return <ConditionalFieldRenderer field={field} role={role} />;
  }
  return <FieldRendererInner field={field} role={role} />;
});
