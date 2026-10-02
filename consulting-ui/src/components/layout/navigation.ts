import type { SvgIconComponent } from '@mui/icons-material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import DynamicFormOutlinedIcon from '@mui/icons-material/DynamicFormOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import type { EffectiveAccess } from '@/features/access';
import { REQUIREMENTS_MODULE_KEY, REQUIREMENTS_SUB_MODULES } from '@/features/requirements/constants';

export interface NavChildItem {
  label: string;
  path: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: SvgIconComponent;
  children?: NavChildItem[];
  /** Tenant module key gating this item for plain (non-admin) tenant
   * employees — hidden unless the tenant has it enabled and the employee
   * has at least one granted action on it. Ignored for Super Admins. */
  moduleKey?: string;
  /** If set, only shown to users holding one of these role codes. Ignored
   * for Super Admins, who always see the full unfiltered nav. */
  requiresRoles?: string[];
}

function matchesPath(itemPath: string, pathname: string): boolean {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Whether a nav item (or one of its children) represents the current route. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.children) {
    return item.children.some((child) => matchesPath(child.path, pathname));
  }
  return matchesPath(item.path, pathname);
}

export interface BreadcrumbTrailItem {
  label: string;
  path?: string;
}

const ID_LIKE = /^[0-9a-f-]{8,}$/i;

/**
 * Best-effort breadcrumb trail for the header, derived from the route alone.
 * Pages with real hierarchy (e.g. an employee's name) still set their own,
 * more precise breadcrumbs via `PageHeader` in the page body.
 */
export function getBreadcrumbsForPath(pathname: string): BreadcrumbTrailItem[] {
  for (const item of navItems) {
    if (item.path === pathname) {
      return [{ label: item.label }];
    }
    const child = item.children?.find((entry) => entry.path === pathname);
    if (child) {
      return [{ label: item.label, path: item.path }, { label: child.label }];
    }
  }

  const parent = navItems.find((item) => item.path !== '/' && pathname.startsWith(`${item.path}/`));
  if (!parent) return [];

  const remainder = pathname.slice(parent.path.length + 1).split('/')[0];
  const label =
    !remainder || ID_LIKE.test(remainder)
      ? 'Details'
      : remainder.charAt(0).toUpperCase() + remainder.slice(1).replace(/-/g, ' ');

  return [{ label: parent.label, path: parent.path }, { label }];
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardOutlinedIcon },
  { label: 'Employees', path: '/employees', icon: PeopleOutlinedIcon, moduleKey: 'employees' },
  {
    label: 'Employee Access',
    path: '/tenant-admin/employees',
    icon: AdminPanelSettingsOutlinedIcon,
    requiresRoles: ['TENANT_ADMIN'],
  },
  {
    label: 'Recruitment',
    path: '/recruitment',
    icon: BadgeOutlinedIcon,
    moduleKey: 'recruitment',
    children: [
      { label: 'Overview', path: '/recruitment' },
      { label: 'Candidates', path: '/recruitment/candidates' },
      { label: 'Interviews', path: '/recruitment/interviews' },
    ],
  },
  { label: 'Attendance', path: '/attendance', icon: EventAvailableOutlinedIcon, moduleKey: 'attendance' },
  { label: 'Payroll', path: '/payroll', icon: PaymentsOutlinedIcon, moduleKey: 'payroll' },
  { label: 'Tenants', path: '/tenants', icon: ApartmentOutlinedIcon, requiresRoles: ['SUPER_ADMIN'] },
  {
    label: 'Form Builder',
    path: '/form-builder-demo',
    icon: DynamicFormOutlinedIcon,
    requiresRoles: ['SUPER_ADMIN'],
  },
];

/**
 * Tenant admins are scoped to Employees only while the rest of the tenant
 * console is still being built out — see `TenantAdminScopeGuard`, which
 * enforces this same restriction at the route level.
 */
export const TENANT_ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Employees', path: '/tenant-admin/employees', icon: PeopleOutlinedIcon },
];

/** Builds Requirements navigation from the sub-modules actually granted to
 * the current user. Tenant admins receive all enabled sub-modules from the
 * access API; employees see only the rows assigned by their tenant admin. */
function buildRequirementsNavItem(access: EffectiveAccess | undefined): NavItem | null {
  const module = access?.modules[REQUIREMENTS_MODULE_KEY];
  if (!module?.enabled) return null;

  const children = REQUIREMENTS_SUB_MODULES.filter(
    ({ key }) => (module.subModules[key]?.length ?? 0) > 0,
  ).map(({ label, path }) => ({ label, path }));

  if (children.length === 0) return null;

  return { label: 'Requirements', path: '/clients', icon: AssignmentOutlinedIcon, children };
}

/** Whether a flat, non-hierarchical module (Employees, Recruitment,
 * Attendance, Payroll, ...) is enabled for the tenant and grants at least
 * one action. */
function isModuleVisible(moduleKey: string | undefined, access: EffectiveAccess | undefined): boolean {
  if (!moduleKey) return true;
  const module = access?.modules[moduleKey];
  if (!module?.enabled) return false;
  return Object.values(module.subModules).some((actions) => actions.length > 0);
}

function hasRequiredRole(requiresRoles: string[] | undefined, roleCodes: string[]): boolean {
  if (!requiresRoles) return true;
  return requiresRoles.some((role) => roleCodes.includes(role));
}

export function getVisibleNavItems(roleCodes: string[], access: EffectiveAccess | undefined): NavItem[] {
  const isSuperAdmin = roleCodes.includes('SUPER_ADMIN');
  const isScopedTenantAdmin = roleCodes.includes('TENANT_ADMIN') && !isSuperAdmin;
  const requirementsItem = buildRequirementsNavItem(access);

  if (isScopedTenantAdmin) {
    return requirementsItem ? [...TENANT_ADMIN_NAV_ITEMS, requirementsItem] : TENANT_ADMIN_NAV_ITEMS;
  }

  if (isSuperAdmin) {
    // Keep the platform console focused on tenant management for now.
    return navItems.filter((item) => item.path === '/tenants');
  }

  // Plain tenant employees: only modules their tenant has enabled AND they
  // have at least READ on, plus items with no module/role requirement.
  const filtered = navItems.filter(
    (item) => hasRequiredRole(item.requiresRoles, roleCodes) && isModuleVisible(item.moduleKey, access),
  );
  return requirementsItem ? [...filtered, requirementsItem] : filtered;
}
