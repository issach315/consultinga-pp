const PREFIX = 'consulting-ui';

export function getStorageKey(key: string): string {
  return `${PREFIX}:${key}`;
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota exceeded) — fail silently.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(getStorageKey(key));
  } catch {
    // Storage unavailable — fail silently.
  }
}
