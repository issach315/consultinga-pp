import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextOutlinedIcon from '@mui/icons-material/NavigateNextOutlined';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  sx?: SxProps<Theme>;
}

export function Breadcrumbs({ items, sx }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <MuiBreadcrumbs
      aria-label="Breadcrumb"
      separator={<NavigateNextOutlinedIcon sx={{ fontSize: 16 }} />}
      sx={{ mb: 1, ...sx }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (!item.path || isLast) {
          return (
            <Typography
              key={item.label}
              color="text.primary"
              variant="body2"
              fontWeight={600}
              noWrap
            >
              {item.label}
            </Typography>
          );
        }
        return (
          <Link
            key={item.label}
            component={RouterLink}
            to={item.path}
            underline="hover"
            color="text.secondary"
            variant="body2"
            noWrap
          >
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
