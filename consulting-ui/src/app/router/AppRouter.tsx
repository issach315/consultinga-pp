import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { LoginPage, AcceptInvitePage } from '@/features/auth';
import { EmployeesPage, EmployeeCreatePage, EmployeeDetailsPage } from '@/features/employees';
import {
  BulkEmployeeOnboardPage,
  EmployeeOnboardPage,
  TenantAdminEmployeeDetailPage,
  TenantAdminEmployeesPage,
} from '@/features/tenant-admin-employees';
import { RecruitmentPage, CandidatesPage, InterviewsPage } from '@/features/recruitment';
import { AttendancePage } from '@/features/attendance';
import { PayrollPage } from '@/features/payroll';
import {
  TenantsPage,
  TenantCreatePage,
  TenantEditPage,
  TenantProfilePage,
} from '@/features/tenants';
import {
  REQUIREMENTS_MODULE_KEY,
  ClientsPage,
  RequirementsPage,
  JobFormPage,
  JobDetailPage,
  SubmissionFormPage,
  SubmissionsPage,
  InterviewsPage as RequirementsInterviewsPage,
  PlacementsPage,
  BenchPage,
  RequirementsLandingPage,
} from '@/features/requirements';
import { DashboardPage, NotFoundPage, FormBuilderDemoPage } from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import { RequireRole } from './RequireRole';
import { RequireModule } from './RequireModule';
import { RequirePermission } from './RequirePermission';
import { TenantAdminScopeGuard } from './TenantAdminScopeGuard';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

      <Route
        element={
          <ProtectedRoute>
            <TenantAdminScopeGuard>
              <AppLayout />
            </TenantAdminScopeGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/new" element={<EmployeeCreatePage />} />
        <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
        <Route
          path="/tenant-admin/employees"
          element={
            <RequireRole roles={['TENANT_ADMIN']}>
              <TenantAdminEmployeesPage />
            </RequireRole>
          }
        />
        <Route
          path="/tenant-admin/employees/:id"
          element={
            <RequireRole roles={['TENANT_ADMIN']}>
              <TenantAdminEmployeeDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/tenant-admin/employees/new"
          element={
            <RequireRole roles={['TENANT_ADMIN']}>
              <EmployeeOnboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/tenant-admin/employees/bulk"
          element={
            <RequireRole roles={['TENANT_ADMIN']}>
              <BulkEmployeeOnboardPage />
            </RequireRole>
          }
        />

        <Route path="/recruitment" element={<RecruitmentPage />} />
        <Route path="/recruitment/candidates" element={<CandidatesPage />} />
        <Route path="/recruitment/interviews" element={<InterviewsPage />} />

        <Route
          path="/requirements"
          element={
            <RequireModule moduleKey={REQUIREMENTS_MODULE_KEY}>
              <RequirementsLandingPage />
            </RequireModule>
          }
        />
        <Route path="/requirements/clients" element={<Navigate to="/clients" replace />} />
        <Route
          path="/clients"
          element={
            <RequirePermission moduleKey={REQUIREMENTS_MODULE_KEY} subModuleKey="clients">
              <ClientsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/requirements/requirements"
          element={<Navigate to="/clients/requirements" replace />}
        />
        <Route
          path="/clients/requirements"
          element={
            <RequirePermission moduleKey={REQUIREMENTS_MODULE_KEY} subModuleKey="requirements">
              <RequirementsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/clients/requirements/new"
          element={
            <RequirePermission
              moduleKey={REQUIREMENTS_MODULE_KEY}
              subModuleKey="requirements"
              action="CREATE"
            >
              <JobFormPage />
            </RequirePermission>
          }
        />
        <Route
          path="/clients/requirements/:id"
          element={
            <RequirePermission moduleKey={REQUIREMENTS_MODULE_KEY} subModuleKey="requirements">
              <JobDetailPage />
            </RequirePermission>
          }
        />
        <Route
          path="/clients/requirements/:jobId/submissions/new"
          element={
            <RequirePermission
              moduleKey={REQUIREMENTS_MODULE_KEY}
              subModuleKey="submissions"
              action="CREATE"
            >
              <SubmissionFormPage />
            </RequirePermission>
          }
        />
        <Route
          path="/clients/requirements/:id/edit"
          element={
            <RequirePermission
              moduleKey={REQUIREMENTS_MODULE_KEY}
              subModuleKey="requirements"
              action="UPDATE"
            >
              <JobFormPage />
            </RequirePermission>
          }
        />
        <Route
          path="/requirements/submissions"
          element={
            <RequirePermission moduleKey={REQUIREMENTS_MODULE_KEY} subModuleKey="submissions">
              <SubmissionsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/requirements/interviews"
          element={
            <RequirePermission moduleKey={REQUIREMENTS_MODULE_KEY} subModuleKey="interviews">
              <RequirementsInterviewsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/requirements/placements"
          element={
            <RequirePermission moduleKey={REQUIREMENTS_MODULE_KEY} subModuleKey="placements">
              <PlacementsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/requirements/bench"
          element={
            <RequirePermission moduleKey={REQUIREMENTS_MODULE_KEY} subModuleKey="bench">
              <BenchPage />
            </RequirePermission>
          }
        />

        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:id" element={<TenantProfilePage />} />
        <Route
          path="/tenants/new"
          element={
            <RequireRole roles={['SUPER_ADMIN']}>
              <TenantCreatePage />
            </RequireRole>
          }
        />
        <Route
          path="/tenants/:id/edit"
          element={
            <RequireRole roles={['SUPER_ADMIN']}>
              <TenantEditPage />
            </RequireRole>
          }
        />
        <Route
          path="/form-builder-demo"
          element={
            <RequireRole roles={['SUPER_ADMIN']}>
              <FormBuilderDemoPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
