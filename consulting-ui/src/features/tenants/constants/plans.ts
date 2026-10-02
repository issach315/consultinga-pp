export type TenantPlanId = 'Starter' | 'Professional' | 'Enterprise';

export interface PlanDef {
  id: TenantPlanId;
  desc: string;
  price: string;
  period: string;
  min: number;
  max: number;
  default: number;
  support: string;
  badge?: string;
  features: string[];
}

// Mirrors consulting-api/app/modules/tenants/constants.py PLAN_DEFS — the
// backend independently re-validates employee_limit against these same
// ranges, this copy only drives the wizard's UI and client-side validation.
export const PLAN_DEFS: PlanDef[] = [
  {
    id: 'Starter',
    desc: 'For small teams getting started with the platform.',
    price: '$49',
    period: '/mo',
    min: 1,
    max: 50,
    default: 25,
    support: 'Email support',
    features: [
      'Core HR & attendance modules',
      'Email support · 1 business day SLA',
      'Standard onboarding checklist',
    ],
  },
  {
    id: 'Professional',
    desc: 'Growing organizations that need more capacity & modules.',
    price: '$149',
    period: '/mo',
    min: 50,
    max: 250,
    default: 150,
    support: 'Priority support',
    badge: 'Popular',
    features: [
      'Everything in Starter',
      'Priority support · 4 hour SLA',
      'Advanced reporting & analytics',
      'Custom branding',
    ],
  },
  {
    id: 'Enterprise',
    desc: 'Full-scale deployments with dedicated support & limits.',
    price: 'Custom',
    period: '',
    min: 250,
    max: 2000,
    default: 500,
    support: 'Dedicated account manager',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'SLA & uptime guarantee',
      'Unlimited API access',
    ],
  },
];

export function getPlanDef(id: TenantPlanId): PlanDef {
  return PLAN_DEFS.find((plan) => plan.id === id) ?? PLAN_DEFS[PLAN_DEFS.length - 1]!;
}

export const PLAN_TONE: Record<TenantPlanId, 'default' | 'info' | 'success'> = {
  Starter: 'default',
  Professional: 'info',
  Enterprise: 'success',
};

export interface ModuleDef {
  key: string;
  name: string;
  desc: string;
}

export const MODULE_DEFS: ModuleDef[] = [
  { key: 'recruitment', name: 'Recruitment', desc: 'Jobs, candidates & interviews' },
  { key: 'employees', name: 'Employees', desc: 'Employee records & profiles' },
  { key: 'attendance', name: 'Attendance', desc: 'Attendance, shifts & leave' },
  { key: 'payroll', name: 'Payroll', desc: 'Salary & payslips' },
  { key: 'events', name: 'Events', desc: 'Calendar & company events' },
  { key: 'invoices', name: 'Invoices', desc: 'Billing & invoices' },
  {
    key: 'requirements',
    name: 'Requirements',
    desc: 'Clients, requirements, submissions & placements',
  },
  { key: 'reports', name: 'Reports', desc: 'Analytics & reports' },
];
