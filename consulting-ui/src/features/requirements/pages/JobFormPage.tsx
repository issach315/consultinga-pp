import { Alert, CircularProgress, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout';
import { useCreateJobMutation, useJobDetailQuery, useUpdateJobMutation } from '../api/jobQueries';
import { JobForm } from '../components/JobForm';
import { jobInitialValues, type JobFormValues } from '../schemas/jobSchema';
import type { Job, JobPayload } from '../types/job.types';

function toFormValues(job: Job): JobFormValues {
  return {
    clientId: job.clientId,
    jobTitle: job.jobTitle,
    jobType: job.jobType ?? '',
    employmentType: job.employmentType,
    experienceMin: job.experienceMin,
    experienceMax: job.experienceMax,
    positions: job.positions,
    location: job.location,
    workMode: job.workMode,
    salaryRange: job.salaryRange ?? '',
    priority: job.priority,
    status: job.status,
    skills: job.skills,
    assignedRecruiters: job.assignedRecruiters.map((entry) => entry.id),
    assignedTeamLeads: job.assignedTeamLeads.map((entry) => entry.id),
    description: job.description ?? '',
  };
}

function toPayload(values: JobFormValues, editing: boolean): JobPayload {
  return {
    clientId: values.clientId,
    jobTitle: values.jobTitle,
    jobType: values.jobType || undefined,
    employmentType: values.employmentType,
    experienceMin: values.experienceMin,
    experienceMax: values.experienceMax,
    positions: values.positions,
    location: values.location,
    workMode: values.workMode,
    salaryRange: values.salaryRange || undefined,
    priority: values.priority,
    ...(editing ? { status: values.status } : {}),
    skills: values.skills,
    assignedRecruiters: values.assignedRecruiters,
    assignedTeamLeads: values.assignedTeamLeads,
    description: values.description || undefined,
  };
}

export function JobFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const detail = useJobDetailQuery(id);
  const createJob = useCreateJobMutation();
  const updateJob = useUpdateJobMutation(id ?? '');
  const mutation = editing ? updateJob : createJob;

  const cancel = (dirty: boolean) => {
    if (dirty && !window.confirm('Discard your unsaved job changes?')) return;
    navigate('/clients/requirements');
  };

  const submit = async (values: JobFormValues) => {
    const job = editing
      ? await updateJob.mutateAsync(toPayload(values, true))
      : await createJob.mutateAsync(toPayload(values, false));
    navigate('/clients/requirements', {
      replace: true,
      state: { notice: editing ? `${job.jobCode} was updated.` : `${job.jobCode} was posted successfully.` },
    });
  };

  if (editing && detail.isLoading) {
    return <Stack alignItems="center" sx={{ py: 10 }}><CircularProgress /></Stack>;
  }
  if (editing && detail.error) {
    return <Alert severity="error">{detail.error.message}</Alert>;
  }

  return (
    <>
      <PageHeader
        title={editing ? `Edit ${detail.data?.jobCode ?? 'job'}` : 'Post New Job'}
        description={editing ? 'Update job details and assignment responsibilities.' : 'Create a client requirement and assign the delivery team.'}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Requirements', path: '/clients' },
          { label: 'Jobs', path: '/clients/requirements' },
          { label: editing ? 'Edit' : 'Post New Job' },
        ]}
      />
      <JobForm
        initialValues={detail.data ? toFormValues(detail.data) : jobInitialValues}
        editing={editing}
        loading={mutation.isPending}
        error={mutation.error}
        onSubmit={submit}
        onCancel={cancel}
      />
    </>
  );
}
