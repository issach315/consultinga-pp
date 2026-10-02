import type { ChangeEvent, ReactNode } from 'react';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExportContainer,
  GridCsvExportMenuItem,
} from '@mui/x-data-grid';

export interface DataTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  /** Extra filter controls (selects, etc.) rendered inline, next to the search box. */
  filters?: ReactNode;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  actions,
  filters,
}: DataTableToolbarProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value);

  return (
    <GridToolbarContainer sx={{ p: 1.5, gap: 1, flexWrap: 'wrap' }}>
      <TextField
        value={search}
        onChange={handleChange}
        placeholder={searchPlaceholder}
        size="small"
        sx={{ minWidth: 240 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => onSearchChange('')} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
        inputProps={{ 'aria-label': 'Search table' }}
      />
      {filters}
      <Box sx={{ flex: 1 }} />
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExportContainer>
        <GridCsvExportMenuItem />
      </GridToolbarExportContainer>
      {actions}
    </GridToolbarContainer>
  );
}
