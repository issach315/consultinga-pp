import { PlaceholderPage } from '@/components/common';

export function PayrollPage() {
  return (
    <PlaceholderPage
      title="Payroll"
      description="Manage compensation, pay runs, and payroll history."
      breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Payroll' }]}
    />
  );
}

export default PayrollPage;
