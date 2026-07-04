/**
 * CSS authoring rules — enforce design tokens over literal values.
 *
 * Tokens are the single source of truth (see src/shared/styles/tokens.css and
 * src/shared/config/Breakpoints.config.ts). Components must reference tokens via
 * `var(--…)`, never hardcode a hex colour, spacing value, radius, or shadow.
 *
 * Scope is deliberately narrow: this config only checks token-backed properties,
 * so it stays quiet about unrelated stylistic concerns that eslint/prettier owns.
 *
 * Escape hatch: a genuinely one-off value (e.g. an `em` padding that must track
 * font-size) can opt out with an inline `/* stylelint-disable-next-line
 * scale-unlimited/declaration-strict-value *\/` comment plus a reason.
 */

/** Properties that must resolve to a token via var(). */
const TOKEN_BACKED_PROPERTIES = [
  '/color/', // color, background-color, border-color, fill, stroke, …
  'font-family',
  'font-size',
  '/^padding/',
  '/^margin/',
  'gap',
  'row-gap',
  'column-gap',
  'border-radius',
  'box-shadow',
];

/** Literals that are allowed as-is — not design decisions. */
const IGNORED_VALUES = [
  '0',
  'auto',
  'none',
  'inherit',
  'initial',
  'unset',
  'transparent',
  'currentColor',
  '/^100%$/',
];

/** @type {import('stylelint').Config} */
export default {
  plugins: ['stylelint-declaration-strict-value'],
  overrides: [
    {
      files: ['**/*.svelte'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    // No component currently hardcodes hex (all live in the exempt tokens.css),
    // so this locks in as a hard error immediately.
    'color-no-hex': true,
    'scale-unlimited/declaration-strict-value': [
      TOKEN_BACKED_PROPERTIES,
      {
        ignoreValues: IGNORED_VALUES,
        disableFix: true,
        // TODO: flip to 'error' once the component-restyle ticket clears the
        // ~26 existing literal values. Kept as 'warning' so the intentionally
        // deferred restyle debt doesn't hard-fail CI in the meantime.
        severity: 'warning',
        message:
          'Use a design token via var(--…) for "${property}" instead of the literal "${value}" (see src/shared/styles/tokens.css).',
      },
    ],
  },
  ignoreFiles: [
    '.svelte-kit/**',
    'build/**',
    'dist/**',
    'node_modules/**',
    'src-tauri/**',
    // tokens.css and fonts.css are where the literal values are DEFINED — exempt them.
    'src/shared/styles/tokens.css',
    'src/shared/styles/fonts.css',
  ],
};
