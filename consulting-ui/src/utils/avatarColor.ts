import { colors } from '@/theme/colors';

// A small set of the app's existing status/brand hues — bold enough to read
// as a filled avatar background in both light and dark mode, so we don't
// need a separate dark-mode palette.
const AVATAR_PALETTE = [
  colors.info.light,
  colors.success.light,
  colors.warning.light,
  colors.error.light,
  colors.secondary.light,
  colors.grey[600],
];

/** Deterministic name -> color, so the same person always gets the same avatar color. */
export function stringToColor(value: string): string {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]!;
}
