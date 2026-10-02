import { PlaceholderPage } from '@/components/common';

export function BenchPage() {
  return (
    <PlaceholderPage
      title="Bench"
      description="Track consultants currently on the bench under Requirements."
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Requirements', path: '/requirements' },
        { label: 'Bench' },
      ]}
    />
  );
}

export default BenchPage;
