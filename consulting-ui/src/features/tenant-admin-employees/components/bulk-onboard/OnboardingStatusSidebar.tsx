import { Box, Paper, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import type { BulkEmployeeRowValues } from '../../schema/bulkEmployeeOnboardSchema';

interface OnboardingStatusSidebarProps {
  rows: BulkEmployeeRowValues[];
  onDownloadTemplate: () => void;
}

const RULES = [
  { icon: <CheckIcon sx={{ fontSize: 12 }} />, text: 'Employee IDs will be generated sequentially.' },
  { icon: <PriorityHighIcon sx={{ fontSize: 12 }} />, text: 'Each employee must have a valid email and role.' },
  { icon: <MailOutlineIcon sx={{ fontSize: 12 }} />, text: 'Invitation is sent only after successful registration.' },
];

const REQUIRED_FIELDS: (keyof BulkEmployeeRowValues)[] = ['firstName', 'lastName', 'email', 'role'];

export function OnboardingStatusSidebar({ rows, onDownloadTemplate }: OnboardingStatusSidebarProps) {
  const validCount = rows.filter(
    (row) => row.firstName.trim() && row.lastName.trim() && row.email.trim() && row.role.trim(),
  ).length;

  const totalSlots = rows.length * REQUIRED_FIELDS.length;
  const filledSlots = rows.reduce(
    (sum, row) => sum + REQUIRED_FIELDS.filter((key) => String(row[key] ?? '').trim().length > 0).length,
    0,
  );
  const completionPct = totalSlots === 0 ? 0 : Math.round((filledSlots / totalSlots) * 100);

  return (
    <Paper variant="outlined" sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
      <Box sx={{ p: 2.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
          Onboarding status
        </Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 850, letterSpacing: '-1px' }}>
          {rows.length} <Typography component="span" variant="caption" color="text.secondary" fontWeight={600}>employees</Typography>
        </Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75, fontSize: 12, color: 'text.secondary' }}>
          <span>Valid records</span>
          <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
            {validCount} / {rows.length}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75, fontSize: 12, color: 'text.secondary' }}>
          <span>Invite emails</span>
          <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
            {rows.length}
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ p: 2.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
          Completion
        </Typography>
        <Box sx={{ height: 7, bgcolor: 'action.hover', borderRadius: 999, overflow: 'hidden', mb: 1 }}>
          <Box sx={{ width: `${completionPct}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 999 }} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          {completionPct}% of onboarding setup complete
        </Typography>
        <Stack spacing={1.25}>
          {RULES.map((rule) => (
            <Stack key={rule.text} direction="row" spacing={1} alignItems="flex-start">
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {rule.icon}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {rule.text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box sx={{ p: 2.25 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
          Large batch?
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={onDownloadTemplate}
          sx={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 1.5,
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block' }}>
            Import a CSV
          </Typography>
          <Typography variant="caption" color="text.secondary">
            For 20+ employees, download the template, fill it in, then import it on the first step.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
