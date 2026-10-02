import { useEffect, useId, useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react';
import { Box, FormHelperText, InputAdornment, TextField, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import { LabeledField } from '@/components/wizard/LabeledField';
import { CountrySelect } from './CountrySelect';
import { findCountry } from './countries';
import {
  formatPhoneNumber,
  getInternationalPhoneNumber,
  parsePhoneNumber,
  validatePhoneNumber,
  type CountryCode,
} from './phoneUtils';

export interface PhoneNumberFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  defaultCountry?: CountryCode;
  placeholder?: string;
  helperText?: string;
  variant?: 'default' | 'compact';
  /** Purely presentational — this app has no phone-verification (OTP) flow yet; set once one exists. */
  verified?: boolean;
}

/**
 * Global reusable phone-number field: country flag/name/dial-code selector +
 * numeric-only national-number input, backed by libphonenumber-js. The form
 * value is always a single international-format string (e.g. "+91 98765
 * 43210"), so it drops into any existing `phone: z.string().optional()`
 * field with no schema or API changes.
 */
export function PhoneNumberField<T extends FieldValues = FieldValues>({
  name,
  control,
  label,
  required,
  disabled,
  readOnly,
  defaultCountry = 'IN',
  placeholder = 'Enter mobile number',
  helperText,
  variant = 'default',
  verified,
}: PhoneNumberFieldProps<T>) {
  const { field, fieldState } = useController({ name, control });
  const inputId = useId();

  const lastEmittedRef = useRef<string | undefined>(undefined);
  const initial = parsePhoneNumber(field.value as string | undefined, defaultCountry);
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber);
  const [blurred, setBlurred] = useState(false);

  // Re-sync from an externally-changed field value (e.g. form.reset()) — but
  // not from the value we just wrote ourselves, or every keystroke would loop.
  useEffect(() => {
    const currentValue = (field.value as string | undefined) ?? '';
    if (currentValue === lastEmittedRef.current) return;
    const next = parsePhoneNumber(currentValue, defaultCountry);
    setCountry(next.country);
    setNationalNumber(next.nationalNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when the RHF value itself changes
  }, [field.value]);

  const emit = (nextCountry: CountryCode, nextNational: string) => {
    const combined = getInternationalPhoneNumber(nextCountry, nextNational);
    lastEmittedRef.current = combined;
    field.onChange(combined);
  };

  const handleCountryChange = (code: CountryCode) => {
    setCountry(code);
    emit(code, nationalNumber);
  };

  const handleNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    setNationalNumber(digits);
    emit(country, digits);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '');
    setNationalNumber(digits);
    emit(country, digits);
  };

  const combinedValue = nationalNumber ? getInternationalPhoneNumber(country, nationalNumber) : '';
  const formatInvalid = blurred && nationalNumber.length > 0 && !validatePhoneNumber(combinedValue);
  const hasError = Boolean(fieldState.error) || formatInvalid;
  const errorMessage = fieldState.error?.message ?? (formatInvalid ? 'Please enter a valid mobile number.' : undefined);
  const showVerified = verified && !hasError;
  const dialCode = findCountry(country)?.dialCode ?? '';

  const resolvedHelperText =
    errorMessage ??
    (showVerified ? undefined : (helperText ?? `Country code ${dialCode} · Numbers only`));

  const field_ = (
    <>
      <TextField
        id={inputId}
        fullWidth
        variant="outlined"
        size={variant === 'compact' ? 'small' : 'medium'}
        value={formatPhoneNumber(country, nationalNumber)}
        onChange={handleNumberChange}
        onPaste={handlePaste}
        onBlur={() => {
          setBlurred(true);
          field.onBlur();
        }}
        disabled={disabled}
        placeholder={placeholder}
        error={hasError}
        slotProps={{
          input: {
            readOnly,
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1 }}>
                <CountrySelect
                  value={country}
                  onChange={handleCountryChange}
                  disabled={disabled || readOnly}
                  compact={variant === 'compact'}
                  id={`${inputId}-country`}
                />
                <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', ml: 1.25 }} />
              </InputAdornment>
            ),
          },
          htmlInput: { inputMode: 'numeric', 'aria-label': label ?? 'Phone number' },
        }}
      />
      {resolvedHelperText && (
        <FormHelperText error={hasError} sx={{ mx: 0 }}>
          {resolvedHelperText}
        </FormHelperText>
      )}
      {showVerified && (
        <Typography
          variant="caption"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'success.main' }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> Mobile number verified
        </Typography>
      )}
    </>
  );

  if (!label) return <Box>{field_}</Box>;

  return (
    <LabeledField label={label} required={required}>
      {field_}
    </LabeledField>
  );
}
