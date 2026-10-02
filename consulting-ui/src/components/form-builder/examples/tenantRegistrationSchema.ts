import { MODULE_DEFS, PLAN_DEFS } from '@/features/tenants/constants/plans';
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  INDUSTRY_OPTIONS,
  STATE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/features/tenants/constants/formOptions';
import { SUBDOMAIN_MAX_LENGTH, SUBDOMAIN_MIN_LENGTH, SUBDOMAIN_PATTERN } from '@/features/tenants/constants/subdomain';
import { TENANT_TYPE_OPTIONS } from '@/features/tenants/constants/tenantType';
import type { FormSchema } from '../schema.types';

/**
 * Same data this app's hand-built TenantOnboardingWizard collects, driven
 * entirely by this schema instead — proof the engine can power a real,
 * already-shipped production form against the real tenant-creation API.
 */
export interface TenantRegistrationFormValues {
  companyDetails: {
    legalCompanyName: string;
    displayName?: string;
    tenantCode: string;
    subdomain: string;
    industry?: string;
    tenantType: string;
    companyEmail?: string;
    phone?: string;
    website?: string;
  };
  location: {
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    timezone?: string;
    currency?: string;
    businessAddress?: string;
  };
  tenantAdmin: {
    firstName: string;
    lastName: string;
    workEmail: string;
    jobTitle?: string;
    phone?: string;
  };
  modules: string[];
  configuration: {
    plan: string;
    employeeLimit: number;
  };
  branding: {
    primaryBrandColor?: string;
    emailSenderName?: string;
    supportEmail?: string;
  };
}

export const tenantRegistrationSchema: FormSchema = {
  id: 'tenant-registration-demo',
  title: 'New tenant (schema-driven)',
  persistKey: 'tenant-registration-demo',
  steps: [
    {
      id: 'company',
      title: 'Company Details',
      sections: [
        {
          id: 'company-details',
          layout: 'plain',
          fields: [
            {
              type: 'text',
              name: 'companyDetails.legalCompanyName',
              label: 'Legal company name',
              grid: { xs: 12 },
              validation: { required: true, maxLength: 255 },
            },
            {
              type: 'text',
              name: 'companyDetails.displayName',
              label: 'Display name',
              grid: { xs: 12, sm: 6 },
              validation: { maxLength: 255 },
            },
            {
              type: 'text',
              name: 'companyDetails.tenantCode',
              label: 'Tenant code',
              grid: { xs: 12, sm: 6 },
              validation: { required: true, maxLength: 50 },
            },
            {
              type: 'text',
              name: 'companyDetails.subdomain',
              label: 'Subdomain',
              grid: { xs: 12, sm: 6 },
              validation: {
                required: true,
                minLength: SUBDOMAIN_MIN_LENGTH,
                maxLength: SUBDOMAIN_MAX_LENGTH,
                pattern: SUBDOMAIN_PATTERN.source,
                patternMessage: "Lowercase letters, numbers, and hyphens only — can't start or end with a hyphen",
              },
            },
            {
              type: 'select',
              name: 'companyDetails.industry',
              label: 'Industry',
              grid: { xs: 12, sm: 6 },
              options: INDUSTRY_OPTIONS.map((value) => ({ label: value, value })),
            },
            {
              type: 'radio',
              name: 'companyDetails.tenantType',
              label: 'Tenant type',
              grid: { xs: 12 },
              validation: { required: true },
              options: TENANT_TYPE_OPTIONS.map((option) => ({ label: option.label, value: option.id })),
            },
            { type: 'email', name: 'companyDetails.companyEmail', label: 'Company email', grid: { xs: 12, sm: 6 } },
            { type: 'phone', name: 'companyDetails.phone', label: 'Phone', grid: { xs: 12, sm: 6 } },
            { type: 'url', name: 'companyDetails.website', label: 'Website', grid: { xs: 12, sm: 6 } },
          ],
        },
      ],
    },
    {
      id: 'location',
      title: 'Location',
      sections: [
        {
          id: 'location-fields',
          layout: 'plain',
          fields: [
            {
              type: 'select',
              name: 'location.country',
              label: 'Country',
              grid: { xs: 12, sm: 6 },
              options: COUNTRY_OPTIONS.map((value) => ({ label: value, value })),
            },
            {
              type: 'select',
              name: 'location.state',
              label: 'State',
              grid: { xs: 12, sm: 6 },
              options: STATE_OPTIONS.map((value) => ({ label: value, value })),
            },
            { type: 'text', name: 'location.city', label: 'City', grid: { xs: 12, sm: 6 } },
            { type: 'text', name: 'location.postalCode', label: 'Postal code', grid: { xs: 12, sm: 6 } },
            {
              type: 'select',
              name: 'location.timezone',
              label: 'Timezone',
              grid: { xs: 12, sm: 6 },
              options: TIMEZONE_OPTIONS.map((value) => ({ label: value, value })),
            },
            {
              type: 'select',
              name: 'location.currency',
              label: 'Currency',
              grid: { xs: 12, sm: 6 },
              options: CURRENCY_OPTIONS,
            },
            {
              type: 'textarea',
              name: 'location.businessAddress',
              label: 'Business address',
              grid: { xs: 12 },
              rows: 3,
            },
          ],
        },
      ],
    },
    {
      id: 'admin',
      title: 'Tenant Admin',
      sections: [
        {
          id: 'admin-fields',
          layout: 'plain',
          fields: [
            {
              type: 'text',
              name: 'tenantAdmin.firstName',
              label: 'First name',
              grid: { xs: 12, sm: 6 },
              validation: { required: true, maxLength: 100 },
            },
            {
              type: 'text',
              name: 'tenantAdmin.lastName',
              label: 'Last name',
              grid: { xs: 12, sm: 6 },
              validation: { required: true, maxLength: 100 },
            },
            {
              type: 'email',
              name: 'tenantAdmin.workEmail',
              label: 'Work email',
              grid: { xs: 12, sm: 6 },
              validation: { required: true },
            },
            { type: 'text', name: 'tenantAdmin.jobTitle', label: 'Job title', grid: { xs: 12, sm: 6 } },
            { type: 'phone', name: 'tenantAdmin.phone', label: 'Phone', grid: { xs: 12, sm: 6 } },
          ],
        },
      ],
    },
    {
      id: 'modules',
      title: 'Modules & Access',
      sections: [
        {
          id: 'modules-fields',
          layout: 'plain',
          fields: [
            {
              type: 'multiselect',
              name: 'modules',
              label: 'Enabled modules',
              grid: { xs: 12 },
              options: MODULE_DEFS.map((module) => ({ label: module.name, value: module.key })),
            },
          ],
        },
      ],
    },
    {
      id: 'configuration',
      title: 'Plan & Configuration',
      sections: [
        {
          id: 'plan-fields',
          layout: 'plain',
          fields: [
            {
              type: 'radio',
              name: 'configuration.plan',
              label: 'Plan',
              grid: { xs: 12 },
              validation: { required: true },
              options: PLAN_DEFS.map((plan) => ({
                label: `${plan.id} — ${plan.price}${plan.period} (${plan.min.toLocaleString()}–${plan.max.toLocaleString()} employees)`,
                value: plan.id,
              })),
            },
            {
              type: 'number',
              name: 'configuration.employeeLimit',
              label: 'Employee limit',
              grid: { xs: 12, sm: 6 },
              validation: { required: true, min: 1, max: 2000 },
            },
          ],
        },
      ],
    },
    {
      id: 'branding',
      title: 'Branding',
      description: 'The review below summarizes every step before you submit.',
      sections: [
        {
          id: 'branding-fields',
          layout: 'plain',
          fields: [
            {
              type: 'text',
              name: 'branding.primaryBrandColor',
              label: 'Primary brand color (hex)',
              grid: { xs: 12, sm: 6 },
              placeholder: '#343a40',
            },
            { type: 'text', name: 'branding.emailSenderName', label: 'Email sender name', grid: { xs: 12, sm: 6 } },
            { type: 'email', name: 'branding.supportEmail', label: 'Support email', grid: { xs: 12, sm: 6 } },
          ],
        },
      ],
    },
  ],
};
