import { Paper } from '@mui/material';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import { PageHeader, type BreadcrumbItem } from '@/components/layout';
import { EmptyState } from './EmptyState';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function PlaceholderPage({ title, description, breadcrumbs }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <Paper variant="outlined">
        <EmptyState
          icon={<ConstructionOutlinedIcon fontSize="inherit" />}
          title="This module is under construction"
          description="Backend endpoints for this feature aren't wired up yet — the module follows the same feature architecture as Employees."
        />
      </Paper>
    </>
  );
}
