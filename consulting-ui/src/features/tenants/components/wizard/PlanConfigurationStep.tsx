import {
  Box,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { getPlanDef, PLAN_DEFS, type TenantPlanId } from '../../constants/plans';
import type { TenantWizardFormValues } from '../../schemas/tenantWizardSchema';

export function PlanConfigurationStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TenantWizardFormValues>();

  const plan = watch('configuration.plan');
  const employeeLimit = watch('configuration.employeeLimit');
  const planDef = getPlanDef(plan);
  const inRange = employeeLimit >= planDef.min && employeeLimit <= planDef.max;
  const pct = Math.min(Math.max(((employeeLimit - planDef.min) / (planDef.max - planDef.min)) * 100, 0), 100);

  const selectPlan = (id: TenantPlanId) => {
    setValue('configuration.plan', id, { shouldValidate: true });
    const nextPlanDef = getPlanDef(id);
    if (employeeLimit < nextPlanDef.min || employeeLimit > nextPlanDef.max) {
      setValue('configuration.employeeLimit', nextPlanDef.default, { shouldValidate: true });
    }
  };

  const handleLimitChange = (value: number) => {
    setValue('configuration.employeeLimit', value, { shouldValidate: true });
  };

  return (
    <>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Plan &amp; Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the subscription plan and employee capacity for this tenant.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {PLAN_DEFS.map((planOption) => {
          const selected = planOption.id === plan;
          return (
            <Grid size={{ xs: 12, sm: 4 }} key={planOption.id}>
              <Paper
                variant="outlined"
                onClick={() => selectPlan(planOption.id)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  height: '100%',
                  position: 'relative',
                  borderColor: selected ? 'primary.main' : 'divider',
                  borderWidth: selected ? 2 : 1,
                }}
              >
                {planOption.badge && (
                  <Chip
                    label={planOption.badge}
                    size="small"
                    color="primary"
                    sx={{ position: 'absolute', top: -10, left: 12 }}
                  />
                )}
                <Typography variant="subtitle1" fontWeight={700}>
                  {planOption.id}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ my: 0.5 }}>
                  {planOption.price}
                  <Typography component="span" variant="caption" color="text.secondary">
                    {planOption.period}
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                  {planOption.desc}
                </Typography>
                <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                  {planOption.features.map((feature) => (
                    <Typography key={feature} variant="caption">
                      • {feature}
                    </Typography>
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ borderTop: 1, borderColor: 'divider', pt: 1, display: 'block' }}>
                  {planOption.min.toLocaleString()} – {planOption.max.toLocaleString()} employees
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'background.default' }}>
        <Chip label={`${planDef.id} plan`} size="small" sx={{ mb: 1.5 }} />
        <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap">
          <TextField
            type="number"
            label="Employee limit"
            value={employeeLimit}
            onChange={(event) => handleLimitChange(Number(event.target.value))}
            error={Boolean(errors.configuration?.employeeLimit)}
            helperText={errors.configuration?.employeeLimit?.message}
            sx={{ width: 200 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1.5 }}>
            Range: {planDef.min.toLocaleString()} – {planDef.max.toLocaleString()}
          </Typography>
        </Stack>

        <Slider
          value={Math.min(Math.max(employeeLimit, planDef.min), planDef.max)}
          min={planDef.min}
          max={planDef.max}
          onChange={(_, value) => handleLimitChange(value as number)}
          sx={{ mt: 3, mb: 1 }}
        />

        <LinearProgress
          variant="determinate"
          value={pct}
          color={inRange ? 'primary' : 'error'}
          sx={{ height: 8, borderRadius: 999 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {planDef.min.toLocaleString()}
          </Typography>
          <Typography variant="caption" color={inRange ? 'text.secondary' : 'error'} fontWeight={600}>
            {inRange ? 'Within plan capacity' : 'Outside plan range — adjust the limit'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {planDef.max.toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </>
  );
}
