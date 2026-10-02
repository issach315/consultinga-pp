import { Box, Grid, Paper, Switch, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { MODULE_DEFS } from '../../constants/plans';
import type { TenantWizardFormValues } from '../../schemas/tenantWizardSchema';

export function ModulesStep() {
  const { watch, setValue } = useFormContext<TenantWizardFormValues>();
  const modules = watch('modules');

  const toggle = (key: string, enabled: boolean) => {
    const next = enabled ? [...modules, key] : modules.filter((m) => m !== key);
    setValue('modules', next, { shouldDirty: true });
  };

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Modules &amp; Access
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enable the business modules this tenant will use.
      </Typography>

      <Grid container spacing={2}>
        {MODULE_DEFS.map((module) => {
          const enabled = modules.includes(module.key);
          return (
            <Grid size={{ xs: 12, sm: 6 }} key={module.key}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                  borderColor: enabled ? 'primary.main' : 'divider',
                  bgcolor: enabled ? 'action.selected' : 'background.paper',
                }}
              >
                <Box>
                  <Typography variant="subtitle2">{module.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {module.desc}
                  </Typography>
                </Box>
                <Switch
                  checked={enabled}
                  onChange={(event) => toggle(module.key, event.target.checked)}
                />
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
