import type { MouseEvent } from 'react';
import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavLink } from 'react-router-dom';

export interface NavigationItemProps {
  icon: SvgIconComponent;
  label: string;
  /** Present for leaf items — renders as a real link. Omit for accordion/flyout triggers. */
  to?: string;
  active?: boolean;
  /** Icon-only rail mode: hides the label, wraps in a tooltip. */
  collapsed?: boolean;
  hasChildren?: boolean;
  expanded?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  ariaControls?: string;
}

export function NavigationItem({
  icon: Icon,
  label,
  to,
  active = false,
  collapsed = false,
  hasChildren = false,
  expanded = false,
  onClick,
  ariaControls,
}: NavigationItemProps) {
  const button = (
    <ListItemButton
      {...(to ? { component: NavLink, to } : {})}
      onClick={onClick}
      selected={active}
      aria-label={collapsed ? label : undefined}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-controls={ariaControls}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        minHeight: 40,
        justifyContent: collapsed ? 'center' : 'flex-start',
        px: 1.5,
        color: 'text.primary',
        transition: (theme) =>
          theme.transitions.create(['background-color', 'color'], { duration: 200 }),
        '&:hover': { bgcolor: 'action.hover' },
        '&.Mui-selected': {
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          '& .MuiListItemIcon-root': { color: 'primary.dark' },
          '&:hover': { bgcolor: 'primary.lighter' },
        },
        '&.Mui-focusVisible': {
          outline: (theme) => `2px solid ${theme.palette.primary.main}`,
          outlineOffset: -2,
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 'auto' : 36,
          justifyContent: 'center',
          color: 'inherit',
        }}
      >
        <Icon fontSize="small" />
      </ListItemIcon>
      {!collapsed && (
        <>
          <ListItemText
            primary={label}
            slotProps={{
              primary: { fontSize: '0.875rem', fontWeight: 500, noWrap: true },
            }}
          />
          {hasChildren && (
            <ExpandMoreIcon
              fontSize="small"
              sx={{
                color: 'text.secondary',
                transition: (theme) => theme.transitions.create('transform', { duration: 200 }),
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            />
          )}
        </>
      )}
    </ListItemButton>
  );

  if (!collapsed) return button;

  return (
    <Tooltip title={label} placement="right" arrow>
      {button}
    </Tooltip>
  );
}
