import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Form, Formik, useFormikContext } from 'formik';
import type { ApiError } from '@/types';
import { useClientListQuery } from '../api/clientQueries';
import { useJobAssigneesQuery } from '../api/jobQueries';
import { jobValidationSchema, type JobFormValues } from '../schemas/jobSchema';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  JOB_PRIORITY_OPTIONS,
  JOB_STATUS_OPTIONS,
  WORK_MODE_OPTIONS,
} from '../types/job.types';

interface JobFormProps {
  initialValues: JobFormValues;
  editing: boolean;
  loading: boolean;
  error: Error | null;
  onSubmit: (values: JobFormValues) => Promise<void>;
  onCancel: (dirty: boolean) => void;
}

function UnsavedChangesGuard() {
  const { dirty, isSubmitting } = useFormikContext<JobFormValues>();
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty || isSubmitting) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, isSubmitting]);
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export function JobForm({ initialValues, editing, loading, error, onSubmit, onCancel }: JobFormProps) {
  const [skillInput, setSkillInput] = useState('');
  const clients = useClientListQuery({ page: 1, pageSize: 100, status: 'ACTIVE', sortBy: 'companyName', sortOrder: 'asc' });
  const recruiters = useJobAssigneesQuery('RECRUITER');
  const teamLeads = useJobAssigneesQuery('TEAMLEAD');

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={jobValidationSchema}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, dirty, handleChange, handleBlur, setFieldValue }) => {
        const addSkill = () => {
          const skill = skillInput.trim();
          if (!skill || values.skills.some((entry) => entry.toLowerCase() === skill.toLowerCase())) return;
          void setFieldValue('skills', [...values.skills, skill]);
          setSkillInput('');
        };
        return (
          <Form noValidate>
            <UnsavedChangesGuard />
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{(error as ApiError).message || 'Unable to save this job.'}</Alert>}

              <Section title="Client information">
                <TextField
                  select
                  fullWidth
                  required
                  name="clientId"
                  label="Client"
                  value={values.clientId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.clientId && Boolean(errors.clientId)}
                  helperText={touched.clientId && errors.clientId}
                  disabled={clients.isLoading}
                >
                  {clients.data?.items.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.companyName} ({client.clientCode})
                    </MenuItem>
                  ))}
                </TextField>
                {clients.isError && <Alert severity="error" sx={{ mt: 2 }}>Unable to load active clients.</Alert>}
              </Section>

              <Section title="Job information">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField fullWidth required name="jobTitle" label="Job title" value={values.jobTitle} onChange={handleChange} onBlur={handleBlur} error={touched.jobTitle && Boolean(errors.jobTitle)} helperText={touched.jobTitle && errors.jobTitle} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField fullWidth name="jobType" label="Job type" placeholder="Permanent, replacement…" value={values.jobType} onChange={handleChange} onBlur={handleBlur} error={touched.jobType && Boolean(errors.jobType)} helperText={touched.jobType && errors.jobType} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField select fullWidth required name="employmentType" label="Employment type" value={values.employmentType} onChange={handleChange}>
                      {EMPLOYMENT_TYPE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField fullWidth required type="number" name="experienceMin" label="Minimum experience (years)" value={values.experienceMin} onChange={(event) => void setFieldValue('experienceMin', Number(event.target.value))} onBlur={handleBlur} error={touched.experienceMin && Boolean(errors.experienceMin)} helperText={touched.experienceMin && errors.experienceMin} slotProps={{ htmlInput: { min: 0, step: 0.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField fullWidth required type="number" name="experienceMax" label="Maximum experience (years)" value={values.experienceMax} onChange={(event) => void setFieldValue('experienceMax', Number(event.target.value))} onBlur={handleBlur} error={touched.experienceMax && Boolean(errors.experienceMax)} helperText={touched.experienceMax && errors.experienceMax} slotProps={{ htmlInput: { min: 0, step: 0.5 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField fullWidth required type="number" name="positions" label="Number of positions" value={values.positions} onChange={(event) => void setFieldValue('positions', Number(event.target.value))} onBlur={handleBlur} error={touched.positions && Boolean(errors.positions)} helperText={touched.positions && errors.positions} slotProps={{ htmlInput: { min: 1 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField fullWidth required name="location" label="Location" value={values.location} onChange={handleChange} onBlur={handleBlur} error={touched.location && Boolean(errors.location)} helperText={touched.location && errors.location} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField select fullWidth required name="workMode" label="Work mode" value={values.workMode} onChange={handleChange}>
                      {WORK_MODE_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField fullWidth name="salaryRange" label="Salary range" placeholder="6–10 LPA" value={values.salaryRange} onChange={handleChange} onBlur={handleBlur} error={touched.salaryRange && Boolean(errors.salaryRange)} helperText={touched.salaryRange && errors.salaryRange} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <TextField select fullWidth required name="priority" label="Priority" value={values.priority} onChange={handleChange}>
                      {JOB_PRIORITY_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  {editing && (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField select fullWidth required name="status" label="Status" value={values.status} onChange={handleChange}>
                        {JOB_STATUS_OPTIONS.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                  )}
                  <Grid size={12}>
                    <TextField fullWidth multiline minRows={4} name="description" label="Description" value={values.description} onChange={handleChange} onBlur={handleBlur} error={touched.description && Boolean(errors.description)} helperText={touched.description && errors.description} />
                  </Grid>
                </Grid>
              </Section>

              <Section title="Required skills">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
                  <TextField
                    fullWidth
                    label="Add a skill"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addSkill();
                      }
                    }}
                    error={touched.skills && Boolean(errors.skills)}
                    helperText={touched.skills && typeof errors.skills === 'string' ? errors.skills : 'Press Enter or use Add Skill'}
                  />
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={addSkill} sx={{ minWidth: 130, height: 40 }}>
                    Add skill
                  </Button>
                </Stack>
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
                  {values.skills.map((skill) => (
                    <Chip key={skill} label={skill} onDelete={() => void setFieldValue('skills', values.skills.filter((entry) => entry !== skill))} />
                  ))}
                </Stack>
              </Section>

              <Section title="Assignment">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      multiple
                      options={recruiters.data ?? []}
                      loading={recruiters.isLoading}
                      value={(recruiters.data ?? []).filter((entry) => values.assignedRecruiters.includes(entry.id))}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      getOptionLabel={(option) => option.name}
                      onChange={(_event, selected) => void setFieldValue('assignedRecruiters', selected.map((entry) => entry.id))}
                      renderInput={(params) => (
                        <TextField {...params} required label="Assigned recruiters" error={touched.assignedRecruiters && Boolean(errors.assignedRecruiters)} helperText={touched.assignedRecruiters && typeof errors.assignedRecruiters === 'string' ? errors.assignedRecruiters : undefined} slotProps={{ input: { ...params.InputProps, endAdornment: <>{recruiters.isLoading ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</> } }} />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      multiple
                      options={teamLeads.data ?? []}
                      loading={teamLeads.isLoading}
                      value={(teamLeads.data ?? []).filter((entry) => values.assignedTeamLeads.includes(entry.id))}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      getOptionLabel={(option) => option.name}
                      onChange={(_event, selected) => void setFieldValue('assignedTeamLeads', selected.map((entry) => entry.id))}
                      renderInput={(params) => (
                        <TextField {...params} label="Assigned team leads (optional)" error={touched.assignedTeamLeads && Boolean(errors.assignedTeamLeads)} helperText={touched.assignedTeamLeads && typeof errors.assignedTeamLeads === 'string' ? errors.assignedTeamLeads : undefined} slotProps={{ input: { ...params.InputProps, endAdornment: <>{teamLeads.isLoading ? <CircularProgress size={18} /> : null}{params.InputProps.endAdornment}</> } }} />
                      )}
                    />
                  </Grid>
                </Grid>
              </Section>

              <Paper variant="outlined" sx={{ p: 2, position: 'sticky', bottom: 12, zIndex: 2 }}>
                <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                  <Button onClick={() => onCancel(dirty)} disabled={loading}>Cancel</Button>
                  <Button type="submit" variant="contained" loading={loading}>
                    {editing ? 'Update job' : 'Post job'}
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Form>
        );
      }}
    </Formik>
  );
}
