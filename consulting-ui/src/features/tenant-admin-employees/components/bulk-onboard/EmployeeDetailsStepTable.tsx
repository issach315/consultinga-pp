import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { FieldArrayWithId } from 'react-hook-form';
import { Controller, useFormContext } from 'react-hook-form';
import type { SelectOption } from '@/components/form-builder';
import { DEPARTMENT_OPTIONS } from '../../constants/employmentOptions';
import type { BulkEmployeeOnboardFormValues } from '../../schema/bulkEmployeeOnboardSchema';

interface EmployeeDetailsStepTableProps {
  fields: FieldArrayWithId<BulkEmployeeOnboardFormValues, 'employees', 'id'>[];
  roleOptions: SelectOption[];
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}

/** Step 1 — bulk-entry table for basic identity + role fields, matching the mockup's compact spreadsheet layout. */
export function EmployeeDetailsStepTable({ fields, roleOptions, onAddRow, onRemoveRow }: EmployeeDetailsStepTableProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BulkEmployeeOnboardFormValues>();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Employees <Typography component="span" color="text.secondary" fontWeight={500}>· {fields.length} added</Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Employee IDs are generated automatically and cannot be edited.
          </Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<AddIcon fontSize="small" />} onClick={onAddRow}>
          Add employee
        </Button>
      </Box>

      <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
        <Typography variant="caption">
          <strong>Quick setup:</strong> choose a role first — you can then customize permissions per employee on
          the next step.
        </Typography>
      </Alert>

      <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ width: 32 }}>#</TableCell>
              <TableCell>First name *</TableCell>
              <TableCell>Last name *</TableCell>
              <TableCell>Email *</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Role *</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => {
              const rowErrors = errors.employees?.[index];
              return (
                <TableRow key={field.id}>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {String(index + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell sx={{ minWidth: 130 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="First name"
                      error={Boolean(rowErrors?.firstName)}
                      {...register(`employees.${index}.firstName`)}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 130 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Last name"
                      error={Boolean(rowErrors?.lastName)}
                      {...register(`employees.${index}.lastName`)}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      size="small"
                      fullWidth
                      type="email"
                      placeholder="name@company.com"
                      error={Boolean(rowErrors?.email)}
                      {...register(`employees.${index}.email`)}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Controller
                      name={`employees.${index}.department`}
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} select size="small" fullWidth>
                          <MenuItem value="">Select department</MenuItem>
                          {DEPARTMENT_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Controller
                      name={`employees.${index}.role`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <TextField {...field} select size="small" fullWidth error={Boolean(fieldState.error)}>
                          <MenuItem value="">Select role</MenuItem>
                          {roleOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      aria-label="Remove employee"
                      onClick={() => onRemoveRow(index)}
                      disabled={fields.length === 1}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Button size="small" variant="text" startIcon={<AddIcon fontSize="small" />} onClick={onAddRow} sx={{ mt: 1.5 }}>
        Add another employee
      </Button>
    </Box>
  );
}
