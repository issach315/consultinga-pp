import { useRef, useState } from 'react';
import { Box, InputBase, alpha } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

export function GlobalSearch() {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box
      sx={{
        position: 'relative',
        display: { xs: 'none', sm: 'flex' },
        alignItems: 'center',
        width: { sm: 220, md: 320 },
        borderRadius: 2,
        px: 1.25,
        py: 0.75,
        bgcolor: (theme) =>
          alpha(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.04 : 0.08),
        border: '1px solid transparent',
        transition: (theme) =>
          theme.transitions.create(['border-color', 'background-color'], { duration: 200 }),
        '&:hover': {
          bgcolor: (theme) =>
            alpha(theme.palette.text.primary, theme.palette.mode === 'light' ? 0.06 : 0.12),
        },
        '&:focus-within': {
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
        },
      }}
    >
      <SearchOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, flexShrink: 0 }} />
      <InputBase
        inputRef={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setValue('');
            inputRef.current?.blur();
          }
        }}
        placeholder="Search…"
        aria-label="Global search"
        fullWidth
        sx={{ fontSize: '0.875rem', color: 'text.primary' }}
      />
      {!value && (
        <Box
          component="kbd"
          sx={{
            display: { xs: 'none', md: 'block' },
            fontSize: '0.6875rem',
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            px: 0.6,
            py: 0.1,
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          /
        </Box>
      )}
    </Box>
  );
}
