// Mirrors consulting-api/app/modules/tenants/constants.py SUBDOMAIN_* — the
// backend independently re-validates on submit; this copy only drives the
// wizard's inline validation and auto-suggestion.
export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const SUBDOMAIN_MIN_LENGTH = 3;
export const SUBDOMAIN_MAX_LENGTH = 30;
export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'static',
  'assets',
  'localhost',
]);

/** Best-effort slug derived from free text (e.g. a tenant code), trimmed to the allowed length. */
export function slugifySubdomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SUBDOMAIN_MAX_LENGTH);
}
