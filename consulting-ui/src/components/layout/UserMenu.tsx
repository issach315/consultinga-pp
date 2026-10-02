import { useState, type MouseEvent } from 'react';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getInitials } from '@/utils/formatters';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login', { replace: true });
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';
  const primaryRole = user?.roles[0]?.name;

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          onClick={handleOpen}
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
          sx={{ p: 0.5 }}
        >
          <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem' }}>
            {fullName ? getInitials(fullName) : '?'}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 220, borderRadius: 2, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2" noWrap>
            {fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {user?.email}
          </Typography>
          {primaryRole && (
            <Typography
              variant="caption"
              color="primary.dark"
              sx={{ mt: 0.5, display: 'inline-block', fontWeight: 600 }}
            >
              {primaryRole}
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ mx: 1, my: 0.5, borderRadius: 1.5 }}>
          <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
