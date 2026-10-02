import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  TextField,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import { COUNTRIES, findCountry, type CountryOption } from './countries';
import type { CountryCode } from './phoneUtils';

interface CountrySelectProps {
  value: CountryCode | undefined;
  onChange: (code: CountryCode) => void;
  disabled?: boolean;
  compact?: boolean;
  id?: string;
}

function matches(country: CountryOption, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/^\+/, '');
  if (!q) return true;
  return (
    country.name.toLowerCase().includes(q) ||
    country.dialCode.replace('+', '').includes(q) ||
    country.code.toLowerCase().includes(q)
  );
}

/** Trigger button + searchable dropdown for the phone field's country picker. */
export function CountrySelect({ value, onChange, disabled, compact, id }: CountrySelectProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = findCountry(value);
  const open = Boolean(anchorEl);
  const filtered = useMemo(() => COUNTRIES.filter((c) => matches(c, search)), [search]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
    setSearch('');
    setHighlightedIndex(Math.max(0, filtered.findIndex((c) => c.code === value)));
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (code: CountryCode) => {
    onChange(code);
    handleClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const country = filtered[highlightedIndex];
      if (country) handleSelect(country.code);
    } else if (event.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <>
      <Box
        component="button"
        type="button"
        id={id}
        onClick={handleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `Country: ${selected.name}, ${selected.dialCode}` : 'Select country'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          border: 'none',
          background: 'none',
          font: 'inherit',
          color: disabled ? 'text.disabled' : 'text.primary',
          cursor: disabled ? 'default' : 'pointer',
          p: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.1em' }}>
          {selected?.flag}
        </span>
        {!compact && (
          <Typography variant="body2" noWrap sx={{ maxWidth: 110 }}>
            {selected?.name}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {selected?.dialCode}
        </Typography>
        <ArrowDropDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 320, maxWidth: '90vw' } } }}
      >
        <Box sx={{ p: 1.25 }}>
          <TextField
            inputRef={searchRef}
            autoFocus
            fullWidth
            size="small"
            placeholder="Search country or code..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            slotProps={{
              input: {
                startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />,
              },
              htmlInput: { role: 'combobox', 'aria-expanded': open, 'aria-controls': 'phone-country-listbox' },
            }}
          />
        </Box>
        <List id="phone-country-listbox" role="listbox" dense sx={{ maxHeight: 280, overflowY: 'auto', py: 0 }}>
          {filtered.map((country, index) => {
            const isSelected = country.code === value;
            return (
              <ListItemButton
                key={country.code}
                role="option"
                aria-selected={isSelected}
                selected={index === highlightedIndex}
                onClick={() => handleSelect(country.code)}
                onMouseEnter={() => setHighlightedIndex(index)}
                sx={{ gap: 1 }}
              >
                <span aria-hidden="true">{country.flag}</span>
                <ListItemText primary={country.name} slotProps={{ primary: { variant: 'body2', noWrap: true } }} />
                <Typography variant="body2" color="text.secondary">
                  {country.dialCode}
                </Typography>
                {isSelected && <CheckIcon fontSize="small" color="primary" />}
              </ListItemButton>
            );
          })}
          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
              No countries match your search.
            </Typography>
          )}
        </List>
        <Box sx={{ px: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Select a country to change the dialing code
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
