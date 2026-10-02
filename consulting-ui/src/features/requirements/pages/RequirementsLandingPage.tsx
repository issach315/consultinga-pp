import { Navigate } from 'react-router-dom';
import { PlaceholderPage } from '@/components/common';
import { useAccess } from '@/features/access';
import { REQUIREMENTS_MODULE_KEY, REQUIREMENTS_SUB_MODULES } from '../constants';

/**
 * The bare /requirements route. RequireModule already confirmed the
 * tenant has the module enabled before this renders, so landing here with
 * no accessible sub-module means "module on, nothing granted to this
 * employee yet" rather than "module off".
 */
export function RequirementsLandingPage() {
  const { access } = useAccess();
  const subModules = access?.modules[REQUIREMENTS_MODULE_KEY]?.subModules ?? {};

  const first = REQUIREMENTS_SUB_MODULES.find((sub) => (subModules[sub.key]?.length ?? 0) > 0);
  if (first) {
    return <Navigate to={first.path} replace />;
  }

  return (
    <PlaceholderPage
      title="Requirements"
      description="You don't have access to any Requirements sub-modules yet. Contact your tenant admin."
      breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Requirements' }]}
    />
  );
}

export default RequirementsLandingPage;
