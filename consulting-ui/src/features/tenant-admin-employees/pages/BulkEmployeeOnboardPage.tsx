import { useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { StepIconProps } from '@mui/material/StepIcon';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { ErrorState, LoadingState } from '@/components/common';
import { useMyTenantQuery } from '@/features/tenants/api/tenantQueries';
import { ApiError } from '@/types';
import { getRoleOptionsForTenantType } from '../constants/roles';
import { useBulkCreateEmployeesMutation } from '../api/employeeQueries';
import { buildModuleRows } from '../utils/buildModuleRows';
import {
  BULK_EMPLOYEE_ONBOARD_DEFAULT_VALUES,
  bulkEmployeeOnboardSchema,
  emptyBulkEmployeeRow,
  getBulkStepFields,
  type BulkEmployeeOnboardFormValues,
} from '../schema/bulkEmployeeOnboardSchema';
import { downloadEmployeeCsvTemplate, parseEmployeeCsv } from '../utils/bulkEmployeeCsv';
import { EmployeeDetailsStepTable } from '../components/bulk-onboard/EmployeeDetailsStepTable';
import { RolesAccessStepTable } from '../components/bulk-onboard/RolesAccessStepTable';
import { BulkReviewStep } from '../components/bulk-onboard/BulkReviewStep';
import { OnboardingStatusSidebar } from '../components/bulk-onboard/OnboardingStatusSidebar';
import type { BulkEmployeeResult } from '../types/employee.types';

const STEPS = [
  { id: 1, title: 'Employee details', description: 'Basic information' },
  { id: 2, title: 'Roles & access', description: 'Permissions per employee' },
  { id: 3, title: 'Review & invite', description: 'Confirm and send' },
] as const;

function BulkStepIcon({ active, completed, icon }: StepIconProps) {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: completed ? 'success.lighter' : active ? 'primary.main' : 'background.paper',
        color: completed ? 'success.dark' : active ? 'primary.contrastText' : 'text.secondary',
        border: completed ? '1px solid' : active ? 'none' : '1px solid',
        borderColor: completed ? 'success.light' : 'divider',
        fontWeight: 800,
        fontSize: '0.7rem',
      }}
    >
      {completed ? <CheckIcon sx={{ fontSize: 15 }} /> : icon}
    </Box>
  );
}

export function BulkEmployeeOnboardPage() {
  const navigate = useNavigate();
  const tenantQuery = useMyTenantQuery();
  const tenant = tenantQuery.data;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleOptions = useMemo(
    () => (tenant ? getRoleOptionsForTenantType(tenant.tenantType) : []),
    [tenant],
  );
  const moduleRows = useMemo(() => buildModuleRows(tenant?.enabledModules ?? []), [tenant?.enabledModules]);

  const bulkCreate = useBulkCreateEmployeesMutation(tenant?.id ?? '');
  const [results, setResults] = useState<BulkEmployeeResult[] | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [draftNotice, setDraftNotice] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);

  const methods = useForm<BulkEmployeeOnboardFormValues>({
    resolver: zodResolver(bulkEmployeeOnboardSchema),
    defaultValues: BULK_EMPLOYEE_ONBOARD_DEFAULT_VALUES,
    mode: 'onBlur',
  });
  const { trigger, handleSubmit, watch } = methods;
  const { fields, append, remove, replace } = useFieldArray({ control: methods.control, name: 'employees' });
  const rows = watch('employees');

  const handleAddRow = () => append(emptyBulkEmployeeRow());
  const handleRemoveRow = (index: number) => {
    if (fields.length === 1) return;
    remove(index);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseEmployeeCsv(text);
    if (parsed.length === 0) {
      setImportNotice('No rows found in that file.');
      return;
    }
    replace(parsed.map((row) => ({ ...row, role: '', permissions: [] })));
    setImportNotice(`Imported ${parsed.length} employee${parsed.length === 1 ? '' : 's'} from CSV.`);
  };

  const isLastStep = activeStep === STEPS.length;

  const handleNext = async () => {
    const valid = await trigger(getBulkStepFields(activeStep, fields.length));
    if (valid) {
      setActiveStep((step) => Math.min(step + 1, STEPS.length));
    } else {
      setValidationNotice('Please fix the highlighted fields before continuing.');
    }
  };
  const handleBack = () => setActiveStep((step) => Math.max(step - 1, 1));

  const onSubmit = async (values: BulkEmployeeOnboardFormValues) => {
    const outcome = await bulkCreate.mutateAsync(values.employees);
    setResults(outcome.results);
  };

  if (tenantQuery.isLoading) return <LoadingState variant="card" />;
  if (tenantQuery.isError || !tenant) {
    return (
      <ErrorState
        message={tenantQuery.error?.message ?? 'Unable to load your tenant.'}
        onRetry={() => tenantQuery.refetch()}
      />
    );
  }

  if (results) {
    const createdCount = results.filter((r) => r.status === 'created').length;
    const emailFailedCount = results.filter(
      (r) => r.status === 'created' && r.employee?.inviteEmailSent === false,
    ).length;
    return (
      <>
        <PageHeader
          title="Bulk employee onboarding"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Employees', path: '/tenant-admin/employees' },
            { label: 'Bulk onboarding' },
          ]}
        />
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {createdCount} of {results.length} employee{results.length === 1 ? '' : 's'} registered
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {emailFailedCount > 0
              ? `${createdCount - emailFailedCount} of ${createdCount} invitation email(s) sent — ${emailFailedCount} failed and will need to be resent from the employee list.`
              : 'Invitation emails have been sent to every employee registered successfully.'}
          </Typography>
          <List dense>
            {results.map((result) => {
              const emailFailed = result.status === 'created' && result.employee?.inviteEmailSent === false;
              return (
                <ListItem key={result.index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {result.status === 'created' ? (
                      emailFailed ? (
                        <ErrorOutlineIcon color="warning" fontSize="small" />
                      ) : (
                        <CheckCircleOutlineIcon color="success" fontSize="small" />
                      )
                    ) : (
                      <ErrorOutlineIcon color="error" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      result.status === 'created'
                        ? `${result.employee?.firstName} ${result.employee?.lastName} — ${result.employee?.employeeId}`
                        : (result.error ?? 'Could not register this employee.')
                    }
                    secondary={emailFailed ? 'Registered, but the invite email failed to send.' : undefined}
                  />
                </ListItem>
              );
            })}
          </List>
          <Button variant="contained" onClick={() => navigate('/tenant-admin/employees')} sx={{ mt: 2 }}>
            Done
          </Button>
        </Paper>
      </>
    );
  }

  return (
    <FormProvider {...methods}>
      <PageHeader
        title="Bulk employee onboarding"
        description="Register multiple employees, assign roles and configure access before sending invitations."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Employees', path: '/tenant-admin/employees' },
          { label: 'Bulk onboarding' },
        ]}
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon fontSize="small" />}
              onClick={() => navigate('/tenant-admin/employees')}
            >
              Employee list
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon fontSize="small" />}
              onClick={downloadEmployeeCsvTemplate}
            >
              CSV template
            </Button>
          </Stack>
        }
      />

      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ pb: 12 }}>
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5 }}>
          <Stepper activeStep={activeStep - 1}>
            {STEPS.map((step) => (
              <Step key={step.id}>
                <StepLabel
                  StepIconComponent={BulkStepIcon}
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  }
                >
                  {step.title}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems="flex-start">
          <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 3 }}>
            {activeStep === 1 && (
              <>
                <EmployeeDetailsStepTable
                  fields={fields}
                  roleOptions={roleOptions}
                  onAddRow={handleAddRow}
                  onRemoveRow={handleRemoveRow}
                />
                <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<UploadFileOutlinedIcon fontSize="small" />}
                    onClick={handleImportClick}
                  >
                    Import CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={(event) => {
                      handleImportFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </Stack>
              </>
            )}
            {activeStep === 2 && (
              <RolesAccessStepTable fields={fields} modules={moduleRows} enabledModules={tenant.enabledModules} />
            )}
            {activeStep === 3 && <BulkReviewStep rows={rows} modules={moduleRows} />}
          </Paper>

          <OnboardingStatusSidebar rows={rows} onDownloadTemplate={downloadEmployeeCsvTemplate} />
        </Stack>

        <Paper
          elevation={0}
          square
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            px: { xs: 2, md: 4.25 },
            py: 1.5,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={700}>
                {fields.length} employee{fields.length === 1 ? '' : 's'} added
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Complete required fields to continue.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" onClick={() => setDraftNotice(true)}>
                Save draft
              </Button>
              {activeStep > 1 && (
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
              )}
              {isLastStep ? (
                <Button type="submit" variant="contained" loading={bulkCreate.isPending}>
                  Create & invite all
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Review & continue
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <Snackbar
        open={draftNotice}
        autoHideDuration={3000}
        onClose={() => setDraftNotice(false)}
        message="Draft saving isn't available yet — please complete onboarding in one session."
      />
      <Snackbar
        open={Boolean(importNotice)}
        autoHideDuration={4000}
        onClose={() => setImportNotice(null)}
        message={importNotice}
      />
      <Snackbar
        open={Boolean(validationNotice)}
        autoHideDuration={4000}
        onClose={() => setValidationNotice(null)}
        message={validationNotice}
      />
      {bulkCreate.isError && (
        <Alert severity="error" sx={{ position: 'fixed', bottom: 80, right: 24, maxWidth: 360, zIndex: (theme) => theme.zIndex.appBar + 1 }}>
          {bulkCreate.error instanceof ApiError ? bulkCreate.error.message : 'Unable to register these employees.'}
        </Alert>
      )}
    </FormProvider>
  );
}

export default BulkEmployeeOnboardPage;
