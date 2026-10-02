import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { Alert, Box, Button, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { ErrorState, LoadingState } from '@/components/common';
import { WizardSidebar } from '@/components/wizard/WizardSidebar';
import { useMyTenantQuery } from '@/features/tenants/api/tenantQueries';
import { ApiError } from '@/types';
import { getRoleOptionsForTenantType } from '../constants/roles';
import { buildModuleRows } from '../utils/buildModuleRows';
import { useCreateTenantAdminEmployeeMutation, useTenantAdminEmployeeListQuery } from '../api/employeeQueries';
import {
  EMPLOYEE_ONBOARD_STEP_FIELDS,
  EMPLOYEE_ONBOARD_WIZARD_DEFAULT_VALUES,
  employeeOnboardWizardSchema,
  type EmployeeOnboardWizardFormValues,
} from '../schema/employeeOnboardWizardSchema';
import { AccessStep } from '../components/onboard-wizard/AccessStep';
import { EmployeeOnboardReviewStep } from '../components/onboard-wizard/EmployeeOnboardReviewStep';
import { EmploymentStep } from '../components/onboard-wizard/EmploymentStep';
import { EMPLOYEE_WIZARD_STEPS } from '../components/onboard-wizard/employeeWizardSteps';
import { ProfileStep } from '../components/onboard-wizard/ProfileStep';
import { EmployeeCreatedSuccess } from '../components/wizard/EmployeeCreatedSuccess';
import type { CreateTenantEmployeePayload, TenantEmployee } from '../types/employee.types';

function toCreatePayload(values: EmployeeOnboardWizardFormValues): CreateTenantEmployeePayload {
  return {
    firstName: values.profile.firstName,
    lastName: values.profile.lastName,
    email: values.profile.workEmail,
    role: values.employment.role,
    permissions: values.access.permissions,
    joiningDate: values.employment.joiningDate || undefined,
    department: values.employment.department || undefined,
    designation: values.employment.designation || undefined,
    employmentType: values.employment.employmentType || undefined,
    workLocation: values.employment.workLocation || undefined,
    workMode: values.employment.workMode || undefined,
    reportingManagerId: values.employment.reportingManagerId || undefined,
    preferredName: values.profile.preferredName || undefined,
    personalEmail: values.profile.personalEmail || undefined,
    phone: values.profile.phone || undefined,
    dateOfBirth: values.profile.dateOfBirth || undefined,
    gender: values.profile.gender || undefined,
    addressLine: values.profile.addressLine || undefined,
    city: values.profile.city || undefined,
    state: values.profile.state || undefined,
    postalCode: values.profile.postalCode || undefined,
    profilePhotoKey: values.profile.photoObjectKey || undefined,
  };
}

const STEP_COUNT = EMPLOYEE_WIZARD_STEPS.length;

export function EmployeeOnboardPage() {
  const navigate = useNavigate();
  const tenantQuery = useMyTenantQuery();
  const tenant = tenantQuery.data;

  const roleOptions = useMemo(
    () => (tenant ? getRoleOptionsForTenantType(tenant.tenantType) : []),
    [tenant],
  );
  const moduleRows = useMemo(() => buildModuleRows(tenant?.enabledModules ?? []), [tenant?.enabledModules]);

  const managerQuery = useTenantAdminEmployeeListQuery(tenant?.id, { page: 1, pageSize: 100 });
  const managerOptions = managerQuery.data?.items ?? [];

  const createEmployee = useCreateTenantAdminEmployeeMutation(tenant?.id ?? '');
  const [createdEmployee, setCreatedEmployee] = useState<TenantEmployee | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<EmployeeOnboardWizardFormValues>({
    resolver: zodResolver(employeeOnboardWizardSchema),
    defaultValues: EMPLOYEE_ONBOARD_WIZARD_DEFAULT_VALUES,
    mode: 'onBlur',
  });
  const { trigger, handleSubmit } = methods;

  const handleNext = async () => {
    const fields = EMPLOYEE_ONBOARD_STEP_FIELDS[activeStep] ?? [];
    const valid = fields.length === 0 || (await trigger(fields));
    if (valid) setActiveStep((step) => Math.min(step + 1, STEP_COUNT));
  };
  const handleBack = () => setActiveStep((step) => Math.max(step - 1, 1));
  const handleStepClick = (id: number) => setActiveStep(id);

  const isLastStep = activeStep === STEP_COUNT;

  const onSubmit = async (values: EmployeeOnboardWizardFormValues) => {
    if (!tenant) return;
    setSubmitError(null);
    try {
      const created = await createEmployee.mutateAsync(toCreatePayload(values));
      setCreatedEmployee(created);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Unable to create employee.');
    }
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

  if (createdEmployee) {
    return (
      <>
        <PageHeader
          title="Add Employee"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Employees', path: '/tenant-admin/employees' },
            { label: 'New' },
          ]}
        />
        <Paper variant="outlined" sx={{ p: 4 }}>
          <EmployeeCreatedSuccess
            employee={createdEmployee}
            onDone={() => navigate('/tenant-admin/employees')}
          />
        </Paper>
      </>
    );
  }

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return <ProfileStep tenantId={tenant.id} />;
      case 2:
        return (
          <EmploymentStep
            employeeIdPrefix={tenant.employeeIdPrefix}
            roleOptions={roleOptions}
            managerOptions={managerOptions}
          />
        );
      case 3:
        return <AccessStep modules={moduleRows} enabledModules={tenant.enabledModules} />;
      case 4:
        return <EmployeeOnboardReviewStep managerOptions={managerOptions} />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <PageHeader
        title="Add Employee"
        description="Complete the employee profile, employment information and access configuration."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Employees', path: '/tenant-admin/employees' },
          { label: 'New' },
        ]}
        actions={
          <Button variant="outlined" onClick={() => navigate('/tenant-admin/employees')}>
            Cancel
          </Button>
        }
      />

      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          <WizardSidebar
            steps={EMPLOYEE_WIZARD_STEPS}
            title="Add Employee"
            activeStep={activeStep}
            onStepClick={handleStepClick}
            disabled={createEmployee.isPending}
          />

          <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 3 }}>
            {renderStep()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button disabled={activeStep === 1} onClick={handleBack}>
                Back
              </Button>
              {isLastStep ? (
                <Button type="submit" variant="contained" loading={createEmployee.isPending}>
                  Create & Invite
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Continue
                </Button>
              )}
            </Box>
          </Paper>
        </Stack>
      </Box>
    </FormProvider>
  );
}

export default EmployeeOnboardPage;
