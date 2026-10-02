const BASE_DOMAIN = import.meta.env.VITE_APP_BASE_DOMAIN || 'localhost';

/** Returns the tenant subdomain label the app is currently being viewed from, or null on the root domain. */
export function getTenantSubdomain(): string | null {
  const hostname = window.location.hostname.toLowerCase();
  const base = BASE_DOMAIN.toLowerCase();
  if (hostname === base || !hostname.endsWith(`.${base}`)) return null;
  return hostname.slice(0, -(base.length + 1)) || null;
}

/** Builds the login URL for a tenant's subdomain, matching the current protocol/port. */
export function buildTenantLoginUrl(subdomain: string): string {
  const { protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${subdomain}.${BASE_DOMAIN}${portSuffix}`;
}
