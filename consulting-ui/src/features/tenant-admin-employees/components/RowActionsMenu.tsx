import { useState } from 'react';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Divider } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import type { TenantEmployee } from '../types/employee.types';

interface RowActionsMenuProps {
  employee: TenantEmployee;
  onView: (employee: TenantEmployee) => void;
  onEdit: (employee: TenantEmployee) => void;
  onManagePermissions: (employee: TenantEmployee) => void;
  onToggleStatus: (employee: TenantEmployee) => void;
  onResendInvite: (employee: TenantEmployee) => void;
}

export function RowActionsMenu({
  employee,
  onView,
  onEdit,
  onManagePermissions,
  onToggleStatus,
  onResendInvite,
}: RowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const close = () => setAnchorEl(null);
  // Anything not already Inactive offers "Deactivate" — an Invited row can
  // still be revoked before it's ever accepted.
  const isActive = employee.status !== 'INACTIVE';

  return (
    <>
      <IconButton
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        }}
        aria-label="Row actions"
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close} onClick={(event) => event.stopPropagation()}>
        <MenuItem
          onClick={() => {
            close();
            onView(employee);
          }}
        >
          <ListItemIcon>
            <VisibilityOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            onEdit(employee);
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            onManagePermissions(employee);
          }}
        >
          <ListItemIcon>
            <ShieldOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage permissions</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            onResendInvite(employee);
          }}
        >
          <ListItemIcon>
            <MailOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{employee.status === 'INVITED' ? 'Resend invitation' : 'Reset password link'}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            onToggleStatus(employee);
          }}
        >
          <ListItemIcon>
            {isActive ? (
              <ToggleOffOutlinedIcon fontSize="small" color="warning" />
            ) : (
              <ToggleOnOutlinedIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText sx={{ color: isActive ? 'warning.main' : 'success.main' }}>
            {isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
