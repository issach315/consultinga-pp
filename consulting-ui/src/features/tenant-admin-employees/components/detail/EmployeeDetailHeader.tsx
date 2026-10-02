import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import { StatusPill } from '@/components/data-table';
import { formatDate, formatFullName, getInitials } from '@/utils/formatters';
import { EMPLOYEE_STATUS_LABELS, employeeStatusTone } from '../../constants/permissions';
import { getRoleLabel } from '../../constants/roles';
import type { TenantEmployee } from '../../types/employee.types';

interface EmployeeDetailHeaderProps {
  employee: TenantEmployee;
  onBack: () => void;
  onResendInvite: () => void;
  resendInvitePending: boolean;
  onToggleStatus: () => void;
}

/** Summary bar above the tabs — identity, status, and the actions that apply
 * regardless of which tab is open (resend/reset link, activate/deactivate). */
export function EmployeeDetailHeader({
  employee,
  onBack,
  onResendInvite,
  resendInvitePending,
  onToggleStatus,
}: EmployeeDetailHeaderProps) {
  const fullName = formatFullName(employee.firstName, employee.lastName);
  const isActive = employee.status !== 'INACTIVE';

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3.5,
        p: { xs: 2, sm: 2.75 },
        mb: 2.5,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar
          src={employee.profilePhotoUrl ?? undefined}
          variant="rounded"
          sx={{
            width: 62,
            height: 62,
            borderRadius: 2.5,
            fontSize: '1.15rem',
            fontWeight: 700,
            bgcolor: 'grey.100',
            color: 'text.secondary',
          }}
        >
          {getInitials(fullName)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {employee.email} · {employee.employeeId}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
            <StatusPill label={getRoleLabel(employee.role)} tone="info" />
            <StatusPill label={EMPLOYEE_STATUS_LABELS[employee.status]} tone={employeeStatusTone(employee.status)} />
          </Stack>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, mr: 0.5 }}>
          Created {formatDate(employee.createdAt)}
        </Typography>
        <Button variant="outlined" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack}>
          Back
        </Button>
        <Button
          variant="outlined"
          startIcon={<MailOutlineIcon fontSize="small" />}
          onClick={onResendInvite}
          loading={resendInvitePending}
        >
          {employee.status === 'INVITED' ? 'Resend invitation' : 'Reset password link'}
        </Button>
        <Button
          variant="outlined"
          color={isActive ? 'warning' : 'success'}
          startIcon={isActive ? <ToggleOffOutlinedIcon fontSize="small" /> : <ToggleOnOutlinedIcon fontSize="small" />}
          onClick={onToggleStatus}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </Stack>
    </Box>
  );
}
