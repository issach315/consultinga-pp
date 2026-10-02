import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';

export type { CountryCode };
export { getCountries, getCountryCallingCode };

export interface ParsedPhoneNumber {
  country: CountryCode;
  nationalNumber: string;
}

/**
 * Splits a stored phone string (e.g. "+91 98765 43210") into a country +
 * national-digits pair. Falls back to defaultCountry when the string has no
 * recognizable international prefix, or is empty.
 */
export function parsePhoneNumber(
  value: string | undefined | null,
  defaultCountry: CountryCode = 'IN',
): ParsedPhoneNumber {
  const raw = (value ?? '').trim();
  if (!raw) return { country: defaultCountry, nationalNumber: '' };

  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (parsed) {
    return { country: parsed.country ?? defaultCountry, nationalNumber: parsed.nationalNumber };
  }
  // No recognizable prefix — treat the digits as a national number under defaultCountry.
  return { country: defaultCountry, nationalNumber: raw.replace(/\D/g, '') };
}

/** Live "as you type" formatting of the national digits, for display while typing. */
export function formatPhoneNumber(country: CountryCode | undefined, nationalDigits: string): string {
  if (!nationalDigits) return '';
  return new AsYouType(country).input(nationalDigits);
}

/** The combined, country-prefixed value that gets written back to the form field. */
export function getInternationalPhoneNumber(country: CountryCode | undefined, nationalDigits: string): string {
  if (!nationalDigits) return '';
  if (!country) return nationalDigits;
  const formatter = new AsYouType(country);
  formatter.input(nationalDigits);
  const number = formatter.getNumber();
  return number ? number.formatInternational() : `+${getCountryCallingCode(country)} ${nationalDigits}`;
}

/** Empty is valid (phone stays optional everywhere); otherwise validates against the country embedded in the string. */
export function validatePhoneNumber(value: string | undefined | null): boolean {
  const raw = (value ?? '').trim();
  if (!raw) return true;
  return isValidPhoneNumber(raw);
}
