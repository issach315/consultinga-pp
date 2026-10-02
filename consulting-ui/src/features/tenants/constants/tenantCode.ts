const CODE_PREFIX_LENGTH = 6;

/** Best-effort tenant code derived from the company name, e.g. "Acme Consulting" -> "ACMECO482". */
export function generateTenantCode(companyName: string): string {
  const prefix = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_PREFIX_LENGTH);
  const suffix = Math.floor(100 + Math.random() * 900);
  return prefix ? `${prefix}${suffix}` : `TEN${suffix}`;
}
