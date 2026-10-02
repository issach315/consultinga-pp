import { getCountries, getCountryCallingCode, type CountryCode } from './phoneUtils';

export interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

// Shown first, in this order, ahead of the alphabetical rest — mirrors the design's example list.
const PRIORITY_ORDER: CountryCode[] = ['IN', 'US', 'GB', 'AE', 'SG', 'AU', 'CA', 'DE', 'FR', 'JP'];

function flagFromCountryCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

let regionNames: Intl.DisplayNames | undefined;
function countryName(code: CountryCode): string {
  regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
  return regionNames.of(code) ?? code;
}

function buildCountryList(): CountryOption[] {
  const all = getCountries().map(
    (code): CountryOption => ({
      code,
      name: countryName(code),
      dialCode: `+${getCountryCallingCode(code)}`,
      flag: flagFromCountryCode(code),
    }),
  );

  const priority = PRIORITY_ORDER.map((code) => all.find((c) => c.code === code)).filter(
    (c): c is CountryOption => Boolean(c),
  );
  const rest = all
    .filter((c) => !PRIORITY_ORDER.includes(c.code))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...priority, ...rest];
}

/** Computed once at module load and shared by every PhoneNumberField instance on the page. */
export const COUNTRIES: CountryOption[] = buildCountryList();

export function findCountry(code: CountryCode | undefined): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
