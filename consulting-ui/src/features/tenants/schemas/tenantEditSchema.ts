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

// Mirrors the mutable-fields portion of tenantWizardSchema — same rules,
// minus tenantAdmin/confirmed, which don't apply once a tenant already exists.
export const tenantEditSchema = z.object({
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
  isActive: z.boolean(),
});

export type TenantEditFormValues = z.infer<typeof tenantEditSchema>;
