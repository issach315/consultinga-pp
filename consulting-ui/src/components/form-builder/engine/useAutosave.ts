import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

const AUTOSAVE_PREFIX = 'form-builder:draft:';

export function loadDraft<T = unknown>(persistKey: string | undefined): T | null {
  if (!persistKey) return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_PREFIX + persistKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(persistKey: string | undefined): void {
  if (!persistKey) return;
  try {
    localStorage.removeItem(AUTOSAVE_PREFIX + persistKey);
  } catch {
    // best-effort — nothing to recover from here
  }
}

export function saveDraftNow(persistKey: string | undefined, values: unknown): void {
  if (!persistKey) return;
  try {
    localStorage.setItem(AUTOSAVE_PREFIX + persistKey, JSON.stringify(values));
  } catch {
    // storage full/unavailable — autosave is best-effort, fail silently
  }
}

/** Debounced localStorage autosave. A no-op unless persistKey is provided. */
export function useAutosave<TFieldValues extends FieldValues>(
  methods: UseFormReturn<TFieldValues>,
  persistKey: string | undefined,
  debounceMs = 800,
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!persistKey) return undefined;

    const subscription = methods.watch((values) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => saveDraftNow(persistKey, values), debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey, debounceMs]);
}
