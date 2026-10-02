import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import type { EmployeeStatus } from '../types/employee.types';

const statusLabels: Record<EmployeeStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On leave',
};

interface EmployeeFiltersProps {
  status: EmployeeStatus | '';
  onStatusChange: (status: EmployeeStatus | '') => void;
}

export function EmployeeFilters({ status, onStatusChange }: EmployeeFiltersProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onStatusChange(event.target.value as EmployeeStatus | '');
  };

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id="employee-status-filter-label">Status</InputLabel>
      <Select
        labelId="employee-status-filter-label"
        label="Status"
        value={status}
        onChange={handleChange}
      >
        <MenuItem value="">All statuses</MenuItem>
        {Object.entries(statusLabels).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
