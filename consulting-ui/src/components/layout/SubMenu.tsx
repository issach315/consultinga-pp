import { Box, Collapse, List, ListItemButton, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import type { NavChildItem } from './navigation';

interface InlineSubMenuProps {
  variant: 'inline';
  id?: string;
  items: NavChildItem[];
  activePath: string;
  open: boolean;
}

interface FlyoutSubMenuProps {
  variant: 'flyout';
  items: NavChildItem[];
  activePath: string;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  parentLabel?: string;
}

type SubMenuProps = InlineSubMenuProps | FlyoutSubMenuProps;

function isChildActive(item: NavChildItem, activePath: string): boolean {
  return activePath === item.path || activePath.startsWith(`${item.path}/`);
}

export function SubMenu(props: SubMenuProps) {
  if (props.variant === 'inline') {
    const { id, items, activePath, open } = props;
    return (
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List id={id} component="div" disablePadding sx={{ pl: 4.5, pr: 1 }}>
          {items.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={isChildActive(item, activePath)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 34,
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'primary.lighter',
                  color: 'primary.dark',
                },
              }}
            >
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { fontSize: '0.825rem', fontWeight: 500 } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    );
  }

  const { items, activePath, anchorEl, onClose, parentLabel } = props;
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      {parentLabel && (
        <Box sx={{ px: 2, py: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {parentLabel}
          </Typography>
        </Box>
      )}
      {items.map((item) => (
        <MenuItem
          key={item.path}
          component={NavLink}
          to={item.path}
          selected={isChildActive(item, activePath)}
          onClick={onClose}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );
}
