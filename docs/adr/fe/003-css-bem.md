# ADR-FE-003: CSS Naming — BEM with `c-` Component Prefix

## Status
Accepted

## Date
2026-06-27

## Context

Svelte scopes component styles by default, but class names still leak through `:global()`, prop forwarding (`class="..."`), and cross-component composition (e.g. a widget passing a class to a child component). Without a naming convention, these shared class names collide and become hard to trace.

The project also uses design tokens (CSS custom properties like `--clr-border`) and global resets — a prefix convention separates component classes from those concerns at a glance.

## Decision

CSS classes use two namespaced prefixes: `c-` for component styling and `l-` for layout. Both follow BEM structure. They are intentionally separate and can coexist on the same element.

### `c-` — Component classes

Visual styling: colors, backgrounds, typography, borders, shadows.

```
c-{block}
c-{block}__{element}
c-{block}--{modifier}
```

```css
.c-menubar { }
.c-menubar__item { }
.c-menubar__item--open { background-color: var(--clr-border); }
```

### `l-` — Layout classes

Structural positioning: width, height, display, flex/grid, position, margin, padding used for placement.

```
l-{name}
l-{name}__{area}
```

```css
.l-editor  { width: 70%; }
.l-console { display: flex; flex-direction: column; width: 40%; }
```

### Using both on the same element

`l-` and `c-` classes are complementary and regularly appear together. The layout class controls where the element sits; the component class controls how it looks:

```html
<aside class="l-console c-console">
```

```css
/* layout concern */
.l-console { display: flex; width: 40%; }

/* visual concern */
.c-console { color: var(--clr-txt-main); background-color: var(--clr-bg-main); }
```

This separation means layout can be changed without touching visual styles, and vice versa.

### Modifier and element rules

**Modifier** — a variant or state. Double hyphen suffix.
```html
<li class="c-menubar__item c-menubar__item--open">
```

**Element nesting** — elements of elements (`c-block__el1__el2`) are forbidden. Flatten the structure instead.

### Prefix rationale

| Prefix | Meaning | Governs |
|---|---|---|
| `c-` | component | color, background, typography, borders |
| `l-` | layout | width, flex/grid, position, placement padding |

Both prefixes distinguish their classes from design tokens (`--clr-*`, `--fs-*`), global resets (unclassed elements), and third-party injected classes (Monaco uses unprefixed class names).

### Svelte-specific notes

- Component-internal styles go in the `<style>` block without `:global()` — Svelte scoping handles them
- When a class must be applied from outside the component (passed as a prop or forwarded), use `:global(.c-block__element)` and document why
- Modifier classes applied via Svelte's `class:` directive follow the same naming:
  ```html
  <li class:c-menubar__item--open={isOpen}>
  ```

## Consequences

**Positive:**
- Class names are self-documenting: `c-menubar__item--open` immediately communicates block, element, and state
- The `c-` prefix eliminates collisions with token names, resets, and third-party styles (e.g. Monaco injects its own classes)
- Consistent across human and AI-authored components — there is one correct name for any class

**Negative:**
- Class names are verbose — `c-editor-preferences-form__item` is long
- BEM does not handle deep nesting well; elements of elements (`c-block__el1__el2`) are forbidden — flatten the structure instead
