import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { StatusPill } from '@/components/data-table';
import { ApiError } from '@/types';
import { MODULE_DEFS, type ModuleDef } from '../../constants/plans';
import { useUpdateTenantMutation } from '../../api/tenantQueries';
import { tenantMutablePayload } from '../../utils/tenantMutablePayload';
import type { Tenant } from '../../types/tenant.types';

interface TenantModulesSectionProps {
  tenant: Tenant;
  canManage: boolean;
}

export function TenantModulesSection({ tenant, canManage }: TenantModulesSectionProps) {
  const updateTenant = useUpdateTenantMutation(tenant.id);
  const [moduleToDisable, setModuleToDisable] = useState<ModuleDef | null>(null);
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  const setModuleEnabled = async (moduleKey: string, enabled: boolean) => {
    const nextModules = enabled
      ? [...tenant.enabledModules, moduleKey]
      : tenant.enabledModules.filter((key) => key !== moduleKey);

    try {
      await updateTenant.mutateAsync({
        ...tenantMutablePayload(tenant),
        modules: nextModules,
        isActive: tenant.isActive,
      });
      setFeedback({
        severity: 'success',
        message: `${MODULE_DEFS.find((m) => m.key === moduleKey)?.name ?? 'Module'} ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      setFeedback({
        severity: 'error',
        message: error instanceof ApiError ? error.message : 'Unable to update module.',
      });
    }
  };

  const handleToggle = (module: ModuleDef, enabled: boolean) => {
    if (!enabled) {
      setModuleToDisable(module);
      return;
    }
    void setModuleEnabled(module.key, true);
  };

  const confirmDisable = async () => {
    if (!moduleToDisable) return;
    await setModuleEnabled(moduleToDisable.key, false);
    setModuleToDisable(null);
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Modules &amp; permissions
      </Typography>
      <Divider sx={{ mb: 1 }} />
      <Stack divider={<Divider />}>
        {MODULE_DEFS.map((module) => {
          const enabled = tenant.enabledModules.includes(module.key);
          return (
            <Stack
              key={module.key}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{ py: 1.5 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600}>
                  {module.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {module.desc}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                <StatusPill label={enabled ? 'Enabled' : 'Disabled'} tone={enabled ? 'success' : 'default'} />
                <Switch
                  checked={enabled}
                  disabled={!canManage || updateTenant.isPending}
                  onChange={(event) => handleToggle(module, event.target.checked)}
                  inputProps={{ 'aria-label': `Toggle ${module.name} module` }}
                />
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <Dialog open={Boolean(moduleToDisable)} onClose={() => setModuleToDisable(null)}>
        <DialogTitle>Disable {moduleToDisable?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tenant users will immediately lose access to the {moduleToDisable?.name} module. You can re-enable it at any
            time.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleToDisable(null)} disabled={updateTenant.isPending}>
            Cancel
          </Button>
          <Button color="warning" variant="contained" onClick={confirmDisable} loading={updateTenant.isPending}>
            Disable
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {feedback ? (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)} sx={{ width: '100%' }}>
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Paper>
  );
}
