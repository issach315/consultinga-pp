import { Box, Checkbox, Chip, FormControl, InputLabel, ListItemText, MenuItem, Select } from '@mui/material';
import type { SelectOption } from '@/components/form-builder';
import { getRoleLabel } from '../constants/roles';

interface TenantAdminEmployeeFiltersProps {
  roleOptions: SelectOption[];
  roles: string[];
  onRolesChange: (roles: string[]) => void;
}

/** Status is filtered via the tabs above the table — this only handles Role. */
export function TenantAdminEmployeeFilters({ roleOptions, roles, onRolesChange }: TenantAdminEmployeeFiltersProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="employee-role-filter-label">Role</InputLabel>
      <Select
        labelId="employee-role-filter-label"
        label="Role"
        multiple
        value={roles}
        onChange={(event) => {
          const value = event.target.value;
          onRolesChange(typeof value === 'string' ? value.split(',') : value);
        }}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(selected as string[]).map((value) => (
              <Chip key={value} label={getRoleLabel(value)} size="small" />
            ))}
          </Box>
        )}
      >
        {roleOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox size="small" checked={roles.includes(String(option.value))} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
