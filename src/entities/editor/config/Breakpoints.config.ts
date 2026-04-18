/**
 * Must stay in sync with the pixel values documented in
 * src/shared/styles/tokens.css — CSS custom properties can't be read
 * inside `@media` feature queries, so this file is the canonical source
 * and the CSS comment is a mirror.
 */
export const BREAKPOINTS = {
  sm: 800,
  md: 1200,
  lg: 1600,
} as const;
