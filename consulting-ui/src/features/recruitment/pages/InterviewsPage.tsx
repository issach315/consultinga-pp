import { PlaceholderPage } from '@/components/common';

export function InterviewsPage() {
  return (
    <PlaceholderPage
      title="Interviews"
      description="Schedule and track candidate interviews."
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Recruitment', path: '/recruitment' },
        { label: 'Interviews' },
      ]}
    />
  );
}

export default InterviewsPage;
