import { useEffect, useState, type MouseEvent } from 'react';
import { Box, Drawer, IconButton, List, Tooltip, Typography } from '@mui/material';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAccess } from '@/features/access';
import { NavigationItem } from './NavigationItem';
import { SubMenu } from './SubMenu';
import { getVisibleNavItems, isNavItemActive, type NavItem } from './navigation';

export const SIDEBAR_EXPANDED_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 76;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function useAutoExpandActiveSection(pathname: string, items: NavItem[]) {
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const active = items.find((item) => item.children && isNavItemActive(item, pathname));
    return new Set(active ? [active.path] : []);
  });

  useEffect(() => {
    const active = items.find((item) => item.children && isNavItemActive(item, pathname));
    if (active) {
      setOpenSections((prev) => (prev.has(active.path) ? prev : new Set(prev).add(active.path)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items only changes on login/logout, not worth re-running for
  }, [pathname]);

  const toggleSection = (path: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return { openSections, toggleSection };
}

interface SidebarNavListProps {
  collapsed: boolean;
  pathname: string;
  items: NavItem[];
  onNavigate?: () => void;
}

function SidebarNavList({ collapsed, pathname, items, onNavigate }: SidebarNavListProps) {
  const { openSections, toggleSection } = useAutoExpandActiveSection(pathname, items);
  const [flyoutItem, setFlyoutItem] = useState<NavItem | null>(null);
  const [flyoutAnchor, setFlyoutAnchor] = useState<HTMLElement | null>(null);

  const openFlyout = (event: MouseEvent<HTMLElement>, item: NavItem) => {
    setFlyoutAnchor(event.currentTarget);
    setFlyoutItem(item);
  };
  const closeFlyout = () => {
    setFlyoutAnchor(null);
    setFlyoutItem(null);
  };

  return (
    <List
      component="nav"
      sx={{ px: 1.5, flex: 1, overflowY: 'auto' }}
      aria-label="Primary navigation"
    >
      {items.map((item) => {
        const active = isNavItemActive(item, pathname);
        const sectionId = `nav-section-${item.path.replace(/\W+/g, '-')}`;

        if (!item.children) {
          return (
            <NavigationItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              to={item.path}
              active={active}
              collapsed={collapsed}
              onClick={onNavigate}
            />
          );
        }

        if (collapsed) {
          return (
            <NavigationItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={active}
              collapsed
              hasChildren
              onClick={(event) => openFlyout(event, item)}
            />
          );
        }

        const isOpen = openSections.has(item.path);
        return (
          <Box key={item.path}>
            <NavigationItem
              icon={item.icon}
              label={item.label}
              active={active && !isOpen}
              hasChildren
              expanded={isOpen}
              ariaControls={sectionId}
              onClick={() => toggleSection(item.path)}
            />
            <SubMenu
              variant="inline"
              id={sectionId}
              items={item.children}
              activePath={pathname}
              open={isOpen}
            />
          </Box>
        );
      })}

      {flyoutItem?.children && (
        <SubMenu
          variant="flyout"
          items={flyoutItem.children}
          activePath={pathname}
          anchorEl={flyoutAnchor}
          onClose={closeFlyout}
          parentLabel={flyoutItem.label}
        />
      )}
    </List>
  );
}

function useVisibleNavItems(): NavItem[] {
  const { user } = useAuth();
  const { access } = useAccess();
  const roleCodes = user?.roles.map((role) => role.code) ?? [];
  return getVisibleNavItems(roleCodes, access);
}

function DesktopSidebar({
  collapsed,
  onToggleCollapse,
}: Pick<SidebarProps, 'collapsed' | 'onToggleCollapse'>) {
  const { pathname } = useLocation();
  const items = useVisibleNavItems();
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <Box
      component="nav"
      aria-label="Sidebar"
      sx={{
        width,
        flexShrink: 0,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: (theme) => theme.transitions.create('width', { duration: 250 }),
        overflow: 'hidden',
      }}
    >
      <SidebarNavList collapsed={collapsed} pathname={pathname} items={items} />

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1 }}>
        <Tooltip title={collapsed ? 'Expand sidebar' : ''} placement="right">
          <IconButton
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            size="small"
            sx={{
              width: '100%',
              borderRadius: 2,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: 1.5,
              gap: 1,
              '& .MuiTypography-root': { display: collapsed ? 'none' : 'block' },
            }}
          >
            <ChevronLeftOutlinedIcon
              fontSize="small"
              sx={{
                transition: (theme) => theme.transitions.create('transform', { duration: 250 }),
                transform: collapsed ? 'rotate(180deg)' : 'none',
              }}
            />
            <Typography variant="body2" fontWeight={500}>
              Collapse
            </Typography>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

function MobileSidebar({
  mobileOpen,
  onMobileClose,
}: Pick<SidebarProps, 'mobileOpen' | 'onMobileClose'>) {
  const { pathname } = useLocation();
  const items = useVisibleNavItems();

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { width: SIDEBAR_EXPANDED_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {import.meta.env.VITE_APP_NAME ?? 'Consulting SaaS'}
          </Typography>
          <IconButton onClick={onMobileClose} aria-label="Close navigation menu" size="small">
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
        <SidebarNavList collapsed={false} pathname={pathname} items={items} onNavigate={onMobileClose} />
      </Box>
    </Drawer>
  );
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <DesktopSidebar collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      <MobileSidebar mobileOpen={mobileOpen} onMobileClose={onMobileClose} />
    </>
  );
}
