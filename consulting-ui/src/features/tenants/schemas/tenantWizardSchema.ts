import type { Path } from 'react-hook-form';
import { z } from 'zod';
import { PLAN_DEFS, type TenantPlanId } from '../constants/plans';
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_MAX_LENGTH,
  SUBDOMAIN_MIN_LENGTH,
  SUBDOMAIN_PATTERN,
} from '../constants/subdomain';
import { TENANT_TYPE_OPTIONS, type TenantTypeId } from '../constants/tenantType';

const planIds = PLAN_DEFS.map((plan) => plan.id) as [TenantPlanId, ...TenantPlanId[]];
const tenantTypeIds = TENANT_TYPE_OPTIONS.map((option) => option.id) as [TenantTypeId, ...TenantTypeId[]];

export const tenantWizardSchema = z.object({
  companyDetails: z.object({
    legalCompanyName: z.string().min(1, 'Legal company name is required').max(255),
    displayName: z.string().max(255).optional().or(z.literal('')),
    tenantCode: z.string().min(1, 'Tenant code is required').max(50),
    subdomain: z
      .string()
      .min(SUBDOMAIN_MIN_LENGTH, `Subdomain must be at least ${SUBDOMAIN_MIN_LENGTH} characters`)
      .max(SUBDOMAIN_MAX_LENGTH)
      .regex(
        SUBDOMAIN_PATTERN,
        "Lowercase letters, numbers, and hyphens only — can't start or end with a hyphen",
      )
      .refine((value) => !RESERVED_SUBDOMAINS.has(value), { message: 'This subdomain is reserved' }),
    industry: z.string().optional().or(z.literal('')),
    tenantType: z.enum(tenantTypeIds),
    companyEmail: z.string().email('Enter a valid email address').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    website: z.string().optional().or(z.literal('')),
  }),
  location: z.object({
    country: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    postalCode: z.string().optional().or(z.literal('')),
    timezone: z.string().optional().or(z.literal('')),
    currency: z.string().optional().or(z.literal('')),
    businessAddress: z.string().optional().or(z.literal('')),
  }),
  tenantAdmin: z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    workEmail: z.string().min(1, 'Work email is required').email('Enter a valid email address'),
    jobTitle: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
  }),
  modules: z.array(z.string()),
  configuration: z
    .object({
      plan: z.enum(planIds),
      employeeLimit: z.coerce.number().int().positive(),
    })
    .superRefine((value, ctx) => {
      const plan = PLAN_DEFS.find((p) => p.id === value.plan);
      if (plan && (value.employeeLimit < plan.min || value.employeeLimit > plan.max)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['employeeLimit'],
          message: `Employee limit must be between ${plan.min.toLocaleString()} and ${plan.max.toLocaleString()} for the ${plan.id} plan`,
        });
      }
    }),
  branding: z.object({
    logoObjectKey: z.string().optional(),
    logoPreviewUrl: z.string().optional(),
    primaryBrandColor: z.string().optional(),
    emailSenderName: z.string().optional().or(z.literal('')),
    supportEmail: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  }),
  confirmed: z
    .boolean()
    .refine((value) => value === true, {
      message: 'Please confirm the information above before creating the tenant.',
    }),
});

export type TenantWizardFormValues = z.infer<typeof tenantWizardSchema>;

export const TENANT_WIZARD_DEFAULT_VALUES: TenantWizardFormValues = {
  companyDetails: {
    legalCompanyName: '',
    displayName: '',
    tenantCode: '',
    subdomain: '',
    industry: '',
    tenantType: 'Domestic',
    companyEmail: '',
    phone: '',
    website: '',
  },
  location: {
    country: '',
    state: '',
    city: '',
    postalCode: '',
    timezone: '',
    currency: '',
    businessAddress: '',
  },
  tenantAdmin: {
    firstName: '',
    lastName: '',
    workEmail: '',
    jobTitle: '',
    phone: '',
  },
  modules: ['recruitment', 'employees', 'attendance', 'payroll', 'events', 'invoices', 'requirements'],
  configuration: {
    plan: 'Enterprise',
    employeeLimit: 500,
  },
  branding: {
    logoObjectKey: '',
    logoPreviewUrl: '',
    primaryBrandColor: '#343a40',
    emailSenderName: '',
    supportEmail: '',
  },
  confirmed: false,
};

/** Field paths validated before advancing each step — mirrors the backend's per-section required fields. */
export const STEP_FIELDS: Record<number, Path<TenantWizardFormValues>[]> = {
  1: [
    'companyDetails.legalCompanyName',
    'companyDetails.tenantCode',
    'companyDetails.subdomain',
    'companyDetails.tenantType',
    'companyDetails.companyEmail',
  ],
  2: [],
  3: ['tenantAdmin.firstName', 'tenantAdmin.lastName', 'tenantAdmin.workEmail'],
  4: [],
  5: ['configuration.plan', 'configuration.employeeLimit'],
  6: ['branding.supportEmail'],
  7: ['confirmed'],
};
