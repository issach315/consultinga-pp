import type { TypographyVariantsOptions } from '@mui/material/styles';

export const fontFamily = '"Space Grotesk", sans-serif';

const heading = {
  fontFamily,
  fontWeight: 800,
  letterSpacing: '-0.05em',
} as const;

export const typography: TypographyVariantsOptions = {
  fontFamily,
  h1: { ...heading, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1 },
  h2: { ...heading, fontSize: '2rem', fontWeight: 800, lineHeight: 1.15 },
  h3: { ...heading, fontSize: '1.75rem', lineHeight: 1.2 },
  h4: { ...heading, fontSize: '1.5rem', lineHeight: 1.25 },
  h5: { ...heading, fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 },
  h6: { ...heading, fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1.35 },
  subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
  body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.55 },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.55 },
  button: {
    fontFamily,
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: 0,
    textTransform: 'none',
  },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 },
  overline: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};
