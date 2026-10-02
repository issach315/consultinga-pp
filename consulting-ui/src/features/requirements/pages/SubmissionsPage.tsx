import { PlaceholderPage } from '@/components/common';

export function SubmissionsPage() {
  return (
    <PlaceholderPage
      title="Submissions"
      description="Track candidate submissions under Requirements."
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Requirements', path: '/requirements' },
        { label: 'Submissions' },
      ]}
    />
  );
}

export default SubmissionsPage;
