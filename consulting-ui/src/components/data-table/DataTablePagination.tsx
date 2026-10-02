import { Box, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  rowCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions: number[];
  itemLabel?: string;
}

const WINDOW_SIZE = 5;

/** Numbered-page footer, replacing MUI DataGrid's default prev/next-only pagination. */
export function DataTablePagination({
  page,
  pageSize,
  rowCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  itemLabel = 'items',
}: DataTablePaginationProps) {
  const totalPages = Math.max(Math.ceil(rowCount / pageSize), 1);
  const from = rowCount === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, rowCount);

  let windowStart = Math.max(0, page - Math.floor(WINDOW_SIZE / 2));
  const windowEnd = Math.min(totalPages, windowStart + WINDOW_SIZE);
  windowStart = Math.max(0, windowEnd - WINDOW_SIZE);
  const pageNumbers = Array.from({ length: windowEnd - windowStart }, (_, i) => windowStart + i);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        px: 2.25,
        py: 1.25,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {rowCount === 0
            ? `No ${itemLabel}`
            : `Showing ${from}–${to} of ${rowCount.toLocaleString()} ${itemLabel}`}
        </Typography>
        <TextField
          select
          size="small"
          variant="standard"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          slotProps={{ select: { sx: { fontSize: '0.75rem' } } }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option} sx={{ fontSize: '0.75rem' }}>
              {option} / page
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton size="small" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        {windowStart > 0 && <Typography variant="caption" color="text.secondary">…</Typography>}
        {pageNumbers.map((pageNumber) => (
          <IconButton
            key={pageNumber}
            size="small"
            onClick={() => onPageChange(pageNumber)}
            sx={{
              minWidth: 30,
              height: 30,
              borderRadius: 1.5,
              fontSize: '0.75rem',
              border: '1px solid',
              borderColor: pageNumber === page ? 'primary.main' : 'divider',
              bgcolor: pageNumber === page ? 'primary.main' : 'transparent',
              color: pageNumber === page ? 'primary.contrastText' : 'text.secondary',
              '&:hover': {
                bgcolor: pageNumber === page ? 'primary.main' : 'action.hover',
              },
            }}
          >
            {pageNumber + 1}
          </IconButton>
        ))}
        {windowEnd < totalPages && <Typography variant="caption" color="text.secondary">…</Typography>}
        <IconButton size="small" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}
