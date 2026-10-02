import { useState, type MouseEvent } from 'react';
import { Box, IconButton, Menu, Tooltip, Typography } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { EmptyState } from '@/components/common';

export function NotificationsMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          aria-label="Open notifications"
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
        >
          <NotificationsOutlinedIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 320, borderRadius: 2, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2">Notifications</Typography>
        </Box>
        <Box sx={{ px: 1, pb: 1 }}>
          <EmptyState
            icon={<NotificationsOutlinedIcon fontSize="inherit" />}
            title="You're all caught up"
            description="New activity on your workspace will show up here."
          />
        </Box>
      </Menu>
    </>
  );
}
