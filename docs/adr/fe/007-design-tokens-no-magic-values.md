# ADR-FE-007: Design Tokens — No Magic Values in CSS

## Status
Accepted

## Date
2026-07-04

## Context

`src/shared/styles/tokens.css` defines the token set for color, spacing, type scale, radii, shadows, and (via `src/shared/config/Breakpoints.config.ts`) breakpoints. Colors were already fully tokenized in practice, but spacing, radii, and shadows were not: an audit of the existing components found the same visual decision made ad hoc in multiple places — e.g. the identical elevated `box-shadow` duplicated verbatim in `Menu.svelte` and `Preferences.svelte`, and spacing values scattered across seven different rem/px literals with no underlying scale.

Without an enforced rule, a token set is aspirational documentation that a future component (human- or AI-authored) can silently ignore by writing a literal instead of `var(--space-4)`. ADR-FE-003 already established the `c-`/`l-` naming convention for CSS but did not address where the *values* inside those classes come from.

## Decision

Design decisions — color, font family, spacing, type scale, radii, shadows, breakpoints — must be referenced from a token, never written as a literal (a fixed string or a fixed size) in component styles.

```css
/* rejected */
.c-panel {
  padding: 1rem;
  border-radius: 4px;
  background: #181a1b;
}

/* required */
.c-panel {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--clr-bg-surface);
}
```

### Enforcement

`stylelint.config.mjs` (`npm run lint:css`, wired into `npm run lint`) enforces this:

- `color-no-hex` — hard error. No component hardcodes hex today (colors were already tokenized), so this is enforced immediately with no exceptions.
- `scale-unlimited/declaration-strict-value` — requires `var(--…)` on `*color*`, `font-family`, `font-size`, `padding*`/`margin*`, `gap`/`row-gap`/`column-gap`, `border-radius`, and `box-shadow`. Currently set to **warning**, not error: an audit found 27 existing literal values across components that predate this ADR — including `HomePage.svelte` hardcoding an entirely different font stack (`Inter, Avenir, Helvetica, Arial, sans-serif`) than the `--font-family-sans` token it should use. Restyling these onto tokens is a separate follow-up ticket; hard-failing CI on debt that was deliberately deferred would just train contributors to ignore the linter. The rule flips to `error` once that ticket lands.
- `tokens.css` and `fonts.css` are exempt — they're where the literal values (custom properties, `@font-face` font names) are *defined*, not consumed.
- Ignored as non-design literals: `0`, `auto`, `none`, `inherit`, `initial`, `unset`, `transparent`, `currentColor`, `100%`.

### Where a value belongs: CSS custom property vs. Zod config constant

| Question | Store | File |
|---|---|---|
| Consumed by CSS only? | CSS custom property | `src/shared/styles/tokens.css` |
| Does JS/TS branch on it at runtime? | Zod-validated constant | `src/shared/config/` |

CSS custom properties are the default home for anything a stylesheet references — the browser resolves them, no JS involved. A Zod config constant is for values TypeScript reads at runtime: a `matchMedia(...)` query, an `$effect` reacting to window width, a validated user preference (per ADR-FE-001, Zod schemas are the source of truth for both the runtime check and the inferred type).

**Breakpoints are the one value that must live in both.** CSS custom properties cannot be read inside an `@media` feature query, so a breakpoint used in CSS has to be a literal pixel value there. `BREAKPOINTS` in `src/shared/config/Breakpoints.config.ts` is the canonical source; the same pixel values are mirrored in a comment in `tokens.css`. Both must be changed together — the 27-violation follow-up ticket should also add a lint/test check that asserts they haven't drifted.

```ts
// JS/TS
import { BREAKPOINTS } from '$shared/config';
const isNarrow = window.matchMedia(`(max-width: ${BREAKPOINTS.sm}px)`);
```

```css
/* CSS: literal must equal BREAKPOINTS.sm (800) */
@media (max-width: 800px) { … }
```

### Escape hatch

A value that is genuinely not a design decision — e.g. padding in `em` so it tracks the element's own font-size — may opt out with a reason:

```css
/* stylelint-disable-next-line scale-unlimited/declaration-strict-value --
   em keeps this padding proportional to the button's font-size */
padding: 0.4em 0.8em;
```

This should be rare. Frequent use of the escape hatch means the token set is missing a value — add the token instead of disabling the rule.

### Adding a new token

1. Add the custom property to the correct group in `tokens.css` (or the constant to `shared/config/` if JS needs it).
2. Comment it with intent, not just its value.
3. Use it — existing near-duplicate literals should converge onto the new token over time.

## Consequences

**Positive:**
- A mockup or new component can be assembled entirely from the existing token vocabulary — no guessing at a "close enough" pixel value
- `color-no-hex` closes the door on new hardcoded colors immediately, with zero migration cost
- The stylelint message names the exact property and literal value, making violations actionable without reading the rule source
- CSS-vs-config-constant guidance prevents duplicating a value in both stores by default — only breakpoints, which have a real technical reason, live in both

**Negative:**
- The strict-value rule is scoped to a warning until the pre-existing 27 violations are cleared, so it does not yet hard-block regressions in those specific files/properties
- Breakpoints require manual sync between `Breakpoints.config.ts` and a CSS comment — there's no automated check for drift yet (tracked as follow-up work)
- The escape hatch is a judgment call; a careless contributor (or agent) could overuse it to bypass the rule rather than adding a token
