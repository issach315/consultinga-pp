import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { StatusPill } from '@/components/data-table';
import { formatDate, getInitials } from '@/utils/formatters';
import { buildTenantLoginUrl } from '@/utils/tenantSubdomain';
import { PLAN_TONE } from '../../constants/plans';
import type { Tenant } from '../../types/tenant.types';

interface TenantProfileHeaderProps {
  tenant: Tenant;
  canManage: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  toggleActivePending: boolean;
  onDeleteRequest: () => void;
}

export function TenantProfileHeader({
  tenant,
  canManage,
  onEdit,
  onToggleActive,
  toggleActivePending,
  onDeleteRequest,
}: TenantProfileHeaderProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const displayName = tenant.displayName || tenant.legalCompanyName;
  const loginUrl = buildTenantLoginUrl(tenant.subdomain);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopyFeedback('App URL copied to clipboard');
    } catch {
      setCopyFeedback('Could not copy — copy the URL manually.');
    }
  };

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      sx={{ mb: 3 }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar
          src={tenant.logoUrl ?? undefined}
          variant="rounded"
          sx={{ width: 64, height: 64, fontSize: '1.25rem', fontWeight: 700, bgcolor: 'grey.100', color: 'text.secondary' }}
        >
          {getInitials(displayName)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" component="h1" noWrap>
            {displayName}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5, rowGap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {tenant.tenantCode}
            </Typography>
            <StatusPill label={tenant.isActive ? 'Active' : 'Inactive'} tone={tenant.isActive ? 'success' : 'default'} />
            <StatusPill label={tenant.plan} tone={PLAN_TONE[tenant.plan]} />
            <Typography variant="caption" color="text.secondary">
              Created {formatDate(tenant.createdAt)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
            <Link
              href={loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              {loginUrl}
              <OpenInNewOutlinedIcon sx={{ fontSize: 14 }} />
            </Link>
            <Tooltip title="Copy app URL">
              <IconButton size="small" onClick={handleCopy} aria-label="Copy app URL">
                <ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Stack>

      {canManage && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={onEdit}>
            Edit tenant
          </Button>
          <Button
            variant="outlined"
            color={tenant.isActive ? 'warning' : 'success'}
            startIcon={tenant.isActive ? <ToggleOffOutlinedIcon /> : <ToggleOnOutlinedIcon />}
            onClick={onToggleActive}
            loading={toggleActivePending}
          >
            {tenant.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} aria-label="More actions">
            <MoreHorizIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                onDeleteRequest();
              }}
            >
              <ListItemIcon>
                <DeleteOutlineIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText sx={{ color: 'error.main' }}>Delete tenant</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      )}

      <Snackbar
        open={Boolean(copyFeedback)}
        autoHideDuration={2500}
        onClose={() => setCopyFeedback(null)}
        message={copyFeedback}
      />
    </Stack>
  );
}
