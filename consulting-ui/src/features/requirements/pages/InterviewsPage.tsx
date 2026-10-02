import { PlaceholderPage } from '@/components/common';

export function InterviewsPage() {
  return (
    <PlaceholderPage
      title="Interviews"
      description="Schedule and track interviews under Requirements."
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Requirements', path: '/requirements' },
        { label: 'Interviews' },
      ]}
    />
  );
}

export default InterviewsPage;
