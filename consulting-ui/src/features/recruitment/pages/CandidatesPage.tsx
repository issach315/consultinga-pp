import { PlaceholderPage } from '@/components/common';

export function CandidatesPage() {
  return (
    <PlaceholderPage
      title="Candidates"
      description="Review and manage candidates in your talent pipeline."
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Recruitment', path: '/recruitment' },
        { label: 'Candidates' },
      ]}
    />
  );
}

export default CandidatesPage;
