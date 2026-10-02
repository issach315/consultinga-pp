import { useNavigate } from 'react-router-dom';
import { buildTenantLoginUrl } from '@/utils/tenantSubdomain';
import { TenantOnboardingWizard } from '../components/wizard/TenantOnboardingWizard';
import type { Tenant } from '../types/tenant.types';

export function TenantCreatePage() {
  const navigate = useNavigate();

  const handleCreated = (tenant: Tenant) => {
    const loginUrl = buildTenantLoginUrl(tenant.subdomain);
    const emailNotice =
      tenant.inviteEmailSent === false
        ? ` The invite email failed to send — check the mail server configuration; there is no resend option for tenant admins yet.`
        : '';
    navigate('/tenants', {
      replace: true,
      state: {
        successMessage: `Tenant "${tenant.legalCompanyName}" created successfully. They can sign in at ${loginUrl}.${emailNotice}`,
      },
    });
  };

  return <TenantOnboardingWizard onCreated={handleCreated} />;
}

export default TenantCreatePage;
