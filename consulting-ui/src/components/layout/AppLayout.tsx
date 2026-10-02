import { useCallback, useState } from 'react';
import { Box, useMediaQuery, type Theme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageContainer } from './PageContainer';
import { readStorage, writeStorage } from '@/utils/storage';

const COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';

export function AppLayout() {
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const [collapsed, setCollapsed] = useState(() => readStorage(COLLAPSED_STORAGE_KEY, false));
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeStorage(COLLAPSED_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const handleMenuClick = useCallback(() => {
    if (isDesktop) {
      toggleCollapsed();
    } else {
      setMobileOpen(true);
    }
  }, [isDesktop, toggleCollapsed]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: (theme) => theme.zIndex.tooltip + 1,
          px: 2,
          py: 1,
          borderRadius: 1.5,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: '0.875rem',
          fontWeight: 600,
          textDecoration: 'none',
          transform: 'translateY(-150%)',
          transition: (theme) => theme.transitions.create('transform', { duration: 200 }),
          '&:focus-visible': { transform: 'translateY(0)' },
        }}
      >
        Skip to main content
      </Box>

      <Header
        onMenuClick={handleMenuClick}
        menuButtonLabel={
          isDesktop ? (collapsed ? 'Expand sidebar' : 'Collapse sidebar') : 'Open navigation menu'
        }
      />

      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <PageContainer>
              <Outlet />
            </PageContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
