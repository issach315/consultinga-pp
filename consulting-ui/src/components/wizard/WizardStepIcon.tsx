import { Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import type { StepIconProps } from '@mui/material/StepIcon';
import type { WizardStepMeta } from './wizardTypes';

/** Active step shows its number; completed shows a check; everything else shows its icon. */
export function createWizardStepIcon(steps: WizardStepMeta[]) {
  return function WizardStepIcon({ active, completed, icon }: StepIconProps) {
    const step = steps[Number(icon) - 1];
    const StepIconGlyph = step?.icon;

    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: active || completed ? 'primary.main' : 'background.paper',
          color: active || completed ? 'primary.contrastText' : 'text.secondary',
          border: active || completed ? 'none' : '1px solid',
          borderColor: 'divider',
          fontWeight: 700,
          fontSize: '0.75rem',
        }}
      >
        {completed ? (
          <CheckIcon sx={{ fontSize: 16 }} />
        ) : active ? (
          icon
        ) : (
          StepIconGlyph && <StepIconGlyph sx={{ fontSize: 16 }} />
        )}
      </Box>
    );
  };
}
