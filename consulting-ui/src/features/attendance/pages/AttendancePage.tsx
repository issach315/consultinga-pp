import { PlaceholderPage } from '@/components/common';

export function AttendancePage() {
  return (
    <PlaceholderPage
      title="Attendance"
      description="Monitor employee attendance, time-off, and shift schedules."
      breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Attendance' }]}
    />
  );
}

export default AttendancePage;
