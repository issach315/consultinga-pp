import { AppBar, Box, Divider, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useThemeMode } from '@/app/providers/useThemeMode';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { getBreadcrumbsForPath } from './navigation';

interface HeaderProps {
  onMenuClick: () => void;
  menuButtonLabel: string;
}

export function Header({ onMenuClick, menuButtonLabel }: HeaderProps) {
  const { mode, toggleMode } = useThemeMode();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const breadcrumbs = getBreadcrumbsForPath(pathname);
  const showBreadcrumbs =
    !user?.roles.some((role) => role.code === 'SUPER_ADMIN') && breadcrumbs.length > 1;

  return (
    <AppBar position="static" sx={{ bgcolor: 'background.paper', flexShrink: 0 }}>
      <Toolbar sx={{ gap: 1.5, minHeight: 64 }}>
        <Tooltip title={menuButtonLabel}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            aria-label={menuButtonLabel}
          >
            <MenuOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Box
          component={RouterLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: '0.9rem',
              flexShrink: 0,
            }}
            aria-hidden
          >
            C
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              display: { xs: 'none', sm: 'block' },
              whiteSpace: 'nowrap',
            }}
          >
            {import.meta.env.VITE_APP_NAME ?? 'Consulting SaaS'}
          </Typography>
        </Box>

        {showBreadcrumbs && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', md: 'block' }, my: 1.5 }}
            />
            <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
              <Breadcrumbs items={breadcrumbs} sx={{ mb: 0 }} />
            </Box>
          </>
        )}

        <Box sx={{ flex: 1 }} />

        <GlobalSearch />

        <NotificationsMenu />

        <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
          <IconButton onClick={toggleMode} color="inherit" aria-label="Toggle color mode">
            {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ my: 1.5 }} />

        <UserMenu />
      </Toolbar>
    </AppBar>
  );
}
