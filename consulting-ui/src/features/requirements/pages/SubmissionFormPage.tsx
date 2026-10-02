import { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Form, Formik, type FormikProps } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';
import { PageHeader } from '@/components/layout';
import {
  useCandidateListQuery,
  useCreateCandidateMutation,
  useCreateSubmissionMutation,
} from '../api/submissionQueries';
import { useJobDetailQuery } from '../api/jobQueries';
import type { CandidatePayload, SubmissionPayload } from '../types/submission.types';

const schema = Yup.object({
  candidateId: Yup.string().required('Select a candidate'),
  relevantExperience: Yup.number().min(0).max(60).required('Relevant experience is required'),
  currentCtc: Yup.number().min(0).nullable(),
  expectedCtc: Yup.number().min(0).nullable(),
  ctcCurrency: Yup.string().required(),
  ctcPeriod: Yup.string().oneOf(['ANNUAL', 'MONTHLY', 'HOURLY']).required(),
  noticePeriodDays: Yup.number().integer().min(0).max(730).required('Notice period is required'),
  notes: Yup.string().max(5000),
});

const initialValues: SubmissionPayload = {
  candidateId: '',
  relevantExperience: 0,
  currentCtc: undefined,
  expectedCtc: undefined,
  ctcCurrency: 'INR',
  ctcPeriod: 'ANNUAL',
  noticePeriodDays: 0,
  notes: '',
};

const candidateInitial: CandidatePayload = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  currentLocation: '',
  totalExperience: 0,
};

const candidateSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  lastName: Yup.string().trim().required('Last name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string().min(7).required('Phone is required'),
  totalExperience: Yup.number().min(0).max(60).required(),
});

function fieldError(formik: FormikProps<SubmissionPayload>, name: keyof SubmissionPayload) {
  return formik.touched[name] && formik.errors[name] ? String(formik.errors[name]) : undefined;
}

function UnsavedChanges({ dirty }: { dirty: boolean }) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return null;
}

export function SubmissionFormPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const job = useJobDetailQuery(jobId);
  const candidates = useCandidateListQuery({ page: 1, pageSize: 100 });
  const createCandidate = useCreateCandidateMutation();
  const createSubmission = useCreateSubmissionMutation(jobId ?? '');
  const options = useMemo(() => candidates.data?.items ?? [], [candidates.data]);

  if (!jobId) return <Alert severity="error">Job ID is missing.</Alert>;
  if (job.isLoading)
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  if (job.error || !job.data)
    return <Alert severity="error">{job.error?.message ?? 'Job not found.'}</Alert>;

  const cancel = (dirty: boolean) => {
    if (dirty && !window.confirm('Discard your unsaved submission?')) return;
    navigate(`/clients/requirements/${jobId}?tab=submissions`);
  };

  return (
    <>
      <PageHeader
        title="Submit Candidate"
        description={`${job.data.jobCode} · ${job.data.jobTitle} · ${job.data.client.companyName}`}
        breadcrumbs={[
          { label: 'Requirements', path: '/clients/requirements' },
          { label: job.data.jobCode, path: `/clients/requirements/${jobId}` },
          { label: 'Submit Candidate' },
        ]}
      />
      <Formik<SubmissionPayload>
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values) => {
          const submission = await createSubmission.mutateAsync(values);
          navigate(`/clients/requirements/${jobId}?tab=submissions`, {
            replace: true,
            state: { notice: `${submission.submissionCode} was created successfully.` },
          });
        }}
      >
        {(formik) => (
          <Form>
            <UnsavedChanges dirty={formik.dirty && !formik.isSubmitting} />
            <Stack spacing={2.5}>
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  gap={1}
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="h6">Candidate</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select an existing candidate from your tenant registry.
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<PersonAddOutlinedIcon />}
                    onClick={() => setShowCandidateForm((value) => !value)}
                  >
                    {showCandidateForm ? 'Close candidate form' : 'Add new candidate'}
                  </Button>
                </Stack>
                <Autocomplete
                  options={options}
                  loading={candidates.isLoading}
                  value={
                    options.find((candidate) => candidate.id === formik.values.candidateId) ?? null
                  }
                  getOptionLabel={(candidate) =>
                    `${candidate.fullName} · ${candidate.candidateCode} · ${candidate.email}`
                  }
                  onChange={(_, candidate) =>
                    formik.setFieldValue('candidateId', candidate?.id ?? '')
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Candidate *"
                      error={Boolean(fieldError(formik, 'candidateId'))}
                      helperText={
                        fieldError(formik, 'candidateId') ??
                        (options.length === 0 ? 'No candidates found. Add one below.' : undefined)
                      }
                    />
                  )}
                />
                <Collapse in={showCandidateForm}>
                  <Divider sx={{ my: 3 }} />
                  <Formik<CandidatePayload>
                    initialValues={candidateInitial}
                    validationSchema={candidateSchema}
                    onSubmit={async (values, helpers) => {
                      const candidate = await createCandidate.mutateAsync(values);
                      await formik.setFieldValue('candidateId', candidate.id);
                      helpers.resetForm();
                      setShowCandidateForm(false);
                    }}
                  >
                    {(candidateForm) => (
                      <Box component="div">
                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                          Create candidate
                        </Typography>
                        <Grid container spacing={2}>
                          {(
                            [
                              ['firstName', 'First name *'],
                              ['lastName', 'Last name *'],
                              ['email', 'Email *'],
                              ['phone', 'Phone *'],
                              ['currentLocation', 'Current location'],
                              ['totalExperience', 'Total experience (years) *'],
                            ] as const
                          ).map(([name, label]) => (
                            <Grid key={name} size={{ xs: 12, md: 6 }}>
                              <TextField
                                fullWidth
                                name={name}
                                label={label}
                                type={name === 'totalExperience' ? 'number' : 'text'}
                                value={candidateForm.values[name] ?? ''}
                                onChange={candidateForm.handleChange}
                                onBlur={candidateForm.handleBlur}
                                error={Boolean(
                                  candidateForm.touched[name] && candidateForm.errors[name],
                                )}
                                helperText={
                                  candidateForm.touched[name] && candidateForm.errors[name]
                                    ? String(candidateForm.errors[name])
                                    : undefined
                                }
                              />
                            </Grid>
                          ))}
                        </Grid>
                        {createCandidate.error && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            {createCandidate.error.message}
                          </Alert>
                        )}
                        <Button
                          sx={{ mt: 2 }}
                          variant="outlined"
                          startIcon={<AddIcon />}
                          disabled={createCandidate.isPending}
                          onClick={() => candidateForm.submitForm()}
                        >
                          Save candidate
                        </Button>
                      </Box>
                    )}
                  </Formik>
                </Collapse>
              </Paper>

              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Submission details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      name="relevantExperience"
                      label="Relevant experience (years) *"
                      type="number"
                      value={formik.values.relevantExperience}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(fieldError(formik, 'relevantExperience'))}
                      helperText={fieldError(formik, 'relevantExperience')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      name="currentCtc"
                      label="Current CTC"
                      type="number"
                      value={formik.values.currentCtc ?? ''}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      name="expectedCtc"
                      label="Expected CTC"
                      type="number"
                      value={formik.values.expectedCtc ?? ''}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      name="ctcCurrency"
                      label="Currency *"
                      value={formik.values.ctcCurrency}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      select
                      fullWidth
                      name="ctcPeriod"
                      label="CTC period *"
                      value={formik.values.ctcPeriod}
                      onChange={formik.handleChange}
                      slotProps={{ select: { native: true } }}
                    >
                      <option value="ANNUAL">Annual</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="HOURLY">Hourly</option>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      name="noticePeriodDays"
                      label="Notice period (days) *"
                      type="number"
                      value={formik.values.noticePeriodDays}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={Boolean(fieldError(formik, 'noticePeriodDays'))}
                      helperText={fieldError(formik, 'noticePeriodDays')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      name="notes"
                      label="Submission notes"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Submitted by, submitter role, status, timestamps, and submission code are recorded
                  automatically.
                </Alert>
              </Paper>
              {createSubmission.error && (
                <Alert severity="error">{createSubmission.error.message}</Alert>
              )}
              <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => cancel(formik.dirty)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={createSubmission.isPending}>
                  {createSubmission.isPending ? 'Submitting…' : 'Submit Candidate'}
                </Button>
              </Stack>
            </Stack>
          </Form>
        )}
      </Formik>
    </>
  );
}
