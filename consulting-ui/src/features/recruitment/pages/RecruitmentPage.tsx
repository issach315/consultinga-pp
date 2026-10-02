import { PlaceholderPage } from '@/components/common';

export function RecruitmentPage() {
  return (
    <PlaceholderPage
      title="Recruitment"
      description="Track candidates and interviews through your hiring pipeline."
      breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Recruitment' }]}
    />
  );
}

export default RecruitmentPage;
