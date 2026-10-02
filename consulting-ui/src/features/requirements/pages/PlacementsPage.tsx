import { PlaceholderPage } from '@/components/common';

export function PlacementsPage() {
  return (
    <PlaceholderPage
      title="Placements"
      description="Track candidate placements under Requirements."
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Requirements', path: '/requirements' },
        { label: 'Placements' },
      ]}
    />
  );
}

export default PlacementsPage;
