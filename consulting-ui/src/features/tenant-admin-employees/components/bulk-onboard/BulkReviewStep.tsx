import { Alert, Box, Stack, Typography } from '@mui/material';
import { EntityCell, StatusPill } from '@/components/data-table';
import type { PermissionMatrixModuleDef } from '@/components/form-builder';
import { stringToColor } from '@/utils/avatarColor';
import { formatFullName } from '@/utils/formatters';
import { getRoleLabel } from '../../constants/roles';
import type { BulkEmployeeRowValues } from '../../schema/bulkEmployeeOnboardSchema';

interface BulkReviewStepProps {
  rows: BulkEmployeeRowValues[];
  modules: PermissionMatrixModuleDef[];
}

/** Step 3 — per-employee summary before submitting the whole batch, matching the mockup's "Review & invite" intent. */
export function BulkReviewStep({ rows, modules }: BulkReviewStepProps) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
        Review & invite
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Confirm each employee's details before sending invitations.
      </Typography>

      <Stack spacing={1.5}>
        {rows.map((row, index) => {
          const fullName = formatFullName(row.firstName, row.lastName);
          const granted = row.permissions.filter((entry) => entry.actions.length > 0);
          return (
            <Box key={index} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.75 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                <EntityCell
                  primary={fullName || `Employee ${index + 1}`}
                  secondary={row.email || undefined}
                  avatarColor={stringToColor(fullName || row.email || String(index))}
                />
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <StatusPill label={row.role ? getRoleLabel(row.role) : 'No role'} tone={row.role ? 'info' : 'error'} />
                  {row.department && <StatusPill label={row.department} tone="default" />}
                </Stack>
              </Stack>
              {granted.length > 0 && (
                <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1.25 }}>
                  {granted.map((entry) => (
                    <Typography key={entry.module} variant="caption" color="text.secondary">
                      {modules.find((m) => m.key === entry.module)?.name ?? entry.module}: {entry.actions.join(', ')}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>

      <Alert severity="info" variant="outlined" sx={{ mt: 2.5 }}>
        Each employee above will receive an invitation email to activate their account once created.
      </Alert>
    </Box>
  );
}
