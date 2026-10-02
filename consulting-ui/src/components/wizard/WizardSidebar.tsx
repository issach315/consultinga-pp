import { useMemo } from 'react';
import { Paper, Step, StepButton, StepLabel, Stepper, Typography } from '@mui/material';
import { createWizardStepIcon } from './WizardStepIcon';
import type { WizardStepMeta } from './wizardTypes';

interface WizardSidebarProps {
  steps: WizardStepMeta[];
  title?: string;
  activeStep: number;
  onStepClick: (id: number) => void;
  disabled?: boolean;
}

export function WizardSidebar({
  steps,
  title = 'Setup Progress',
  activeStep,
  onStepClick,
  disabled,
}: WizardSidebarProps) {
  const StepIcon = useMemo(() => createWizardStepIcon(steps), [steps]);

  return (
    <Paper variant="outlined" sx={{ p: 2, width: { xs: '100%', md: 280 }, flexShrink: 0, height: 'fit-content' }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 1, mb: 1.5 }}>
        {title}
      </Typography>
      <Stepper
        nonLinear
        activeStep={activeStep - 1}
        orientation="vertical"
        sx={{
          '& .MuiStepLabel-label': { fontWeight: 600 },
          '& .MuiStepLabel-label.Mui-active': { fontWeight: 700 },
        }}
      >
        {steps.map((step) => {
          const active = step.id === activeStep;
          return (
            <Step key={step.id} completed={step.id < activeStep}>
              <StepButton
                disabled={disabled}
                onClick={() => onStepClick(step.id)}
                sx={{
                  borderRadius: 2,
                  bgcolor: active ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
                }}
              >
                <StepLabel
                  StepIconComponent={StepIcon}
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  }
                >
                  {step.title}
                </StepLabel>
              </StepButton>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
}
