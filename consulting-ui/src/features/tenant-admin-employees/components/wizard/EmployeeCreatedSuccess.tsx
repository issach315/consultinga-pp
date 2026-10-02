import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { TenantEmployee } from '../../types/employee.types';

interface EmployeeCreatedSuccessProps {
  employee: TenantEmployee;
  onDone: () => void;
}

export function EmployeeCreatedSuccess({ employee, onDone }: EmployeeCreatedSuccessProps) {
  const emailFailed = employee.inviteEmailSent === false;

  return (
    <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ py: 4 }}>
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          bgcolor: 'success.lighter',
          color: 'success.dark',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircleOutlineIcon fontSize="large" />
      </Box>
      <Box>
        <Typography variant="h6">Employee created</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {emailFailed
            ? `${employee.employeeId} created, but the invite email to ${employee.email} could not be sent.`
            : `${employee.employeeId} — invite email sent to ${employee.email}.`}
        </Typography>
      </Box>
      {emailFailed && (
        <Alert severity="warning" sx={{ textAlign: 'left' }}>
          Use "Resend invitation" from the employee list once the mail issue is resolved.
        </Alert>
      )}
      <Button variant="contained" onClick={onDone}>
        Done
      </Button>
    </Stack>
  );
}
