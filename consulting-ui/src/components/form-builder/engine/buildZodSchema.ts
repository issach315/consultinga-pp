import { z, type ZodTypeAny } from 'zod';
import { validatePhoneNumber } from '@/components/phone-number-field';
import type { FieldSchema, FormSchema, SectionSchema, ValidationRules } from '../schema.types';
import { evaluateCondition } from './conditions';
import { get, isEmptyValue } from './paths';

function applyStringRules(base: z.ZodString, rules: ValidationRules | undefined): z.ZodString {
  let schema = base;
  if (rules?.minLength != null) {
    schema = schema.min(rules.minLength, `Must be at least ${rules.minLength} characters`);
  }
  if (rules?.maxLength != null) {
    schema = schema.max(rules.maxLength, `Must be at most ${rules.maxLength} characters`);
  }
  if (rules?.pattern) {
    schema = schema.regex(new RegExp(rules.pattern), rules.patternMessage ?? 'Invalid format');
  }
  return schema;
}

function fieldLabel(field: FieldSchema): string {
  return field.label ?? field.name;
}

function fieldToZod(field: FieldSchema): ZodTypeAny {
  const rules = field.validation;
  const requiredMsg = rules?.requiredMessage ?? `${fieldLabel(field)} is required`;

  switch (field.type) {
    case 'email': {
      const s = applyStringRules(z.string().email('Enter a valid email address'), rules);
      return rules?.required ? s.min(1, requiredMsg) : s.optional().or(z.literal(''));
    }
    case 'url': {
      const s = applyStringRules(z.string().url('Enter a valid URL'), rules);
      return rules?.required ? s.min(1, requiredMsg) : s.optional().or(z.literal(''));
    }
    case 'text':
    case 'password':
    case 'textarea': {
      const s = applyStringRules(z.string(), rules);
      return rules?.required ? s.min(1, requiredMsg) : s.optional().or(z.literal(''));
    }
    case 'phone': {
      // validatePhoneNumber treats '' as valid, so this already allows an
      // empty (optional) phone field without a separate .optional() branch.
      const s = applyStringRules(z.string(), rules).refine(
        validatePhoneNumber,
        'Please enter a valid mobile number.',
      );
      return rules?.required ? s.refine((value) => value.trim().length > 0, requiredMsg) : s;
    }
    case 'number':
    case 'currency': {
      let numberSchema = z.coerce.number({ invalid_type_error: 'Enter a valid number' });
      if (rules?.min != null) numberSchema = numberSchema.min(rules.min, `Must be at least ${rules.min}`);
      if (rules?.max != null) numberSchema = numberSchema.max(rules.max, `Must be at most ${rules.max}`);
      const finalSchema = rules?.required ? numberSchema : numberSchema.optional();
      // Empty-string inputs coerce to 0 under z.coerce.number(), which would
      // silently satisfy "required" — normalize '' to undefined first so a
      // required numeric field actually rejects a blank input.
      return z.preprocess((val) => (val === '' || val === null ? undefined : val), finalSchema);
    }
    case 'checkbox':
    case 'switch': {
      const s = z.boolean();
      return rules?.required ? s.refine((v) => v === true, requiredMsg) : s;
    }
    case 'date':
    case 'time':
    case 'datetime':
    case 'select':
    case 'radio': {
      const s = z.string();
      return rules?.required ? s.min(1, requiredMsg) : s.optional().or(z.literal(''));
    }
    case 'multiselect':
    case 'multiAutocomplete': {
      const s = z.array(z.union([z.string(), z.number()]));
      return rules?.required ? s.min(1, requiredMsg) : s.optional();
    }
    case 'autocomplete': {
      const s = z.union([z.string(), z.number(), z.null()]);
      return rules?.required ? s.refine((v) => v !== null && v !== '', requiredMsg) : s.optional();
    }
    case 'asyncSelect': {
      if (field.multiple) {
        const s = z.array(z.union([z.string(), z.number()]));
        return rules?.required ? s.min(1, requiredMsg) : s.optional();
      }
      const s = z.union([z.string(), z.number(), z.null()]);
      return rules?.required ? s.refine((v) => v !== null && v !== '', requiredMsg) : s.optional();
    }
    case 'fileUpload': {
      const s = z.array(z.any());
      return rules?.required ? s.min(1, requiredMsg) : s.optional();
    }
    case 'permission_matrix': {
      const s = z.array(
        z.object({
          module: z.string(),
          actions: z.array(z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE'])),
        }),
      );
      return rules?.required ? s.min(1, requiredMsg) : s.optional();
    }
    case 'repeater': {
      let s = z.array(z.object(buildFieldsShape(field.fields)));
      if (field.minItems != null) s = s.min(field.minItems, `At least ${field.minItems} required`);
      if (field.maxItems != null) s = s.max(field.maxItems, `At most ${field.maxItems} allowed`);
      return s;
    }
    case 'heading':
    case 'paragraph':
    case 'divider':
    case 'hidden':
    case 'readonly':
      return z.any().optional();
    default:
      return z.any().optional();
  }
}

/** Plain tree of path segments -> ZodTypeAny, converted to nested z.object shapes at the end. */
type ShapeTree = { [key: string]: ZodTypeAny | ShapeTree };

function isZodType(value: ZodTypeAny | ShapeTree): value is ZodTypeAny {
  return typeof (value as ZodTypeAny)?.parse === 'function';
}

function setPath(tree: ShapeTree, segments: string[], value: ZodTypeAny): void {
  const [head, ...rest] = segments;
  if (head === undefined) return;
  if (rest.length === 0) {
    tree[head] = value;
    return;
  }
  const existing = tree[head];
  const nested: ShapeTree = existing && !isZodType(existing) ? existing : {};
  tree[head] = nested;
  setPath(nested, rest, value);
}

function treeToZodShape(tree: ShapeTree): Record<string, ZodTypeAny> {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, value] of Object.entries(tree)) {
    shape[key] = isZodType(value) ? value : z.object(treeToZodShape(value));
  }
  return shape;
}

function isStaticField(field: FieldSchema): boolean {
  return field.type === 'heading' || field.type === 'paragraph' || field.type === 'divider';
}

export function buildFieldsShape(fields: FieldSchema[]): Record<string, ZodTypeAny> {
  const tree: ShapeTree = {};
  for (const field of fields) {
    if (isStaticField(field)) continue;
    setPath(tree, field.name.split('.'), fieldToZod(field));
  }
  return treeToZodShape(tree);
}

function collectFields(schema: FormSchema): FieldSchema[] {
  const sections: SectionSchema[] = schema.sections ?? schema.steps?.flatMap((step) => step.sections) ?? [];
  return sections.flatMap((section) => section.fields);
}

/** Recursively finds requiredWhen fields, including inside repeater items. */
function collectConditionalRequired(fields: FieldSchema[]): FieldSchema[] {
  return fields.flatMap((field) => {
    const nested = field.type === 'repeater' ? collectConditionalRequired(field.fields) : [];
    return field.requiredWhen ? [field, ...nested] : nested;
  });
}

export function buildZodSchema(schema: FormSchema): ZodTypeAny {
  const fields = collectFields(schema);
  const base = z.object(buildFieldsShape(fields));
  const conditionalRequired = collectConditionalRequired(fields);

  if (conditionalRequired.length === 0) return base;

  return base.superRefine((values, ctx) => {
    for (const field of conditionalRequired) {
      if (!evaluateCondition(field.requiredWhen, values as Record<string, unknown>)) continue;
      const value = get(values, field.name);
      if (isEmptyValue(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: field.name.split('.'),
          message: field.validation?.requiredMessage ?? `${fieldLabel(field)} is required`,
        });
      }
    }
  });
}
