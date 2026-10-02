import { useState, type ReactNode } from 'react';
import { Box, Paper } from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridRowId,
  type GridRowParams,
  type GridRowSelectionModel,
  type GridValidRowModel,
} from '@mui/x-data-grid';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar, type DataTableToolbarProps } from './DataTableToolbar';
import type { useDataTableState } from './useDataTableState';

// Lets slotProps.toolbar/noRowsOverlay accept our custom prop shapes below —
// the documented MUI X extension point for typing custom slot components.
declare module '@mui/x-data-grid' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration-merging requires this exact `extends {}` shape
  interface ToolbarPropsOverrides extends DataTableToolbarProps {}
  interface NoRowsOverlayPropsOverrides {
    title?: string;
    description?: string;
  }
}

interface ServerDataGridProps<T extends GridValidRowModel> {
  columns: GridColDef<T>[];
  rows: T[];
  rowCount: number;
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  getRowId?: (row: T) => GridRowId;
  tableState: ReturnType<typeof useDataTableState>;
  checkboxSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  searchPlaceholder?: string;
  toolbarActions?: ReactNode;
  /** Extra filter controls (selects, etc.) rendered inline in the toolbar. */
  toolbarFilters?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSizeOptions?: number[];
  height?: number | string;
  onRowClick?: (params: GridRowParams<T>) => void;
  itemLabel?: string;
}

export function ServerDataGrid<T extends GridValidRowModel>({
  columns,
  rows,
  rowCount,
  loading,
  error,
  onRetry,
  getRowId,
  tableState,
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  searchPlaceholder,
  toolbarActions,
  toolbarFilters,
  emptyTitle,
  emptyDescription,
  pageSizeOptions = [10, 25, 50, 100],
  height = 560,
  onRowClick,
  itemLabel,
}: ServerDataGridProps<T>) {
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <ErrorState message={error.message} onRetry={onRetry} />
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          rowCount={rowCount}
          loading={loading}
          paginationMode="server"
          sortingMode="server"
          paginationModel={tableState.paginationModel}
          onPaginationModelChange={tableState.setPaginationModel}
          sortModel={tableState.sortModel}
          onSortModelChange={tableState.setSortModel}
          pageSizeOptions={pageSizeOptions}
          checkboxSelection={checkboxSelection}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={onRowSelectionModelChange}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          disableRowSelectionOnClick
          disableColumnMenu={false}
          onRowClick={onRowClick}
          hideFooter
          // Stable component references (not inline arrow functions) — DataGrid
          // remounts a slot whenever its component identity changes, which was
          // unmounting/remounting the search input (and dropping focus) on
          // every keystroke since typing re-renders this component. Props
          // still flow through and update normally via slotProps.
          slots={{
            toolbar: DataTableToolbar,
            noRowsOverlay: EmptyState,
          }}
          slotProps={{
            toolbar: {
              search: tableState.search,
              onSearchChange: tableState.setSearch,
              searchPlaceholder,
              actions: toolbarActions,
              filters: toolbarFilters,
            },
            noRowsOverlay: { title: emptyTitle, description: emptyDescription },
          }}
          sx={{
            border: 'none',
            '--DataGrid-overlayHeight': '280px',
            ...(onRowClick ? { '& .MuiDataGrid-row': { cursor: 'pointer' } } : {}),
          }}
        />
      </Box>
      <DataTablePagination
        page={tableState.paginationModel.page}
        pageSize={tableState.paginationModel.pageSize}
        rowCount={rowCount}
        onPageChange={(page) => tableState.setPaginationModel((prev) => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => tableState.setPaginationModel({ page: 0, pageSize })}
        pageSizeOptions={pageSizeOptions}
        itemLabel={itemLabel}
      />
    </Paper>
  );
}
