# ADR-FE-005: Accessibility

## Status
Accepted

## Date
2026-06-27

## Context

The application is a developer tool with complex interactive patterns: menubar, dropdown menus, modal dialogs, accordions, and form fields. These patterns have well-defined WAI-ARIA specifications. Without explicit accessibility rules, AI agents and future contributors omit ARIA attributes, use `<div>` instead of semantic elements, and break keyboard navigation.

Accessibility is treated as a first-class requirement, not a retrofit.

## Decision

### 1. Semantic HTML first

Use the most semantically correct HTML element before reaching for ARIA. Native elements carry implicit roles, keyboard behaviour, and browser accessibility support for free.

| Pattern | Use |
|---|---|
| Modal / panel | `<dialog>` with `showModal()` — gives top-layer promotion, backdrop, and inert background natively |
| Navigation | `<nav>` |
| Menu container | `<ul role="menu">` or `<ul role="menubar">` |
| Sections | `<main>`, `<header>`, `<aside>`, `<section>` |
| Actions | `<button type="button">` always, never `<div onclick>` |

### 2. ARIA roles on menu patterns

The WAI-ARIA menu pattern requires an explicit role hierarchy. `<li>` elements inside a `role="menu"` receive `role="none"` to neutralise their implicit list item role — the role belongs to the button inside, not the container.

```html
<ul role="menubar" aria-label="Actions menu">
  <li role="none">
    <button role="menuitem" aria-haspopup="menu" aria-controls="menu-id" aria-expanded={isOpen}>
      File
    </button>
    <ul id="menu-id" role="menu" aria-label="File options">
      <li role="none">
        <button role="menuitem">Open</button>
      </li>
    </ul>
  </li>
</ul>
```

### 3. Required ARIA attributes by pattern

**Trigger buttons that open a menu or panel:**
- `aria-haspopup="menu"` (or `"dialog"` for a modal)
- `aria-controls="{id-of-controlled-element}"`
- `aria-expanded={boolean}` — must reflect open/closed state reactively

**Icon-only buttons:**
- `aria-label="Descriptive action"` is mandatory — there is no visible text label

**Form fields:**
- Every input must have an associated `<label>` or `aria-label`
- Validation errors must be announced — use `aria-describedby` pointing to the error element

**Dialogs:**
- Use native `<dialog>` + `showModal()`. Do not build modal behaviour with `<div>`.
- Always provide a visible close button with `aria-label="Close [panel name]"`

### 4. `tabindex` management

- `tabindex={0}` — elements that are reachable in natural tab order (trigger buttons)
- `tabindex={-1}` — elements that receive programmatic focus but are not in tab order (menu containers, close buttons inside dialogs that manage their own focus)
- Never use `tabindex` values greater than `0`

### 5. Focus management

When a menu or panel opens, move focus to the container programmatically using a `$effect`:

```ts
$effect(() => {
  if (isOpen && containerRef) {
    containerRef.focus();
  }
});
```

When a menu closes due to focus leaving (`focusout`), check that focus has truly left the component before dismissing — a click inside the menu also triggers `focusout`:

```ts
function handleFocusOut(e: FocusEvent & { currentTarget: HTMLElement }) {
  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
    close();
  }
}
```

### 6. Keyboard interactions

| Pattern | Required keys |
|---|---|
| Modal dialog | `Escape` closes (native `<dialog>` handles this; add `onkeydown` if custom logic needed) |
| Dropdown menu | `Escape` closes and returns focus to trigger |
| Accordion | `Enter` / `Space` toggles via the button element (native behaviour) |

### 7. Button component passthrough

The shared `Button` component must spread all props via `{...rest}` so ARIA attributes (`aria-label`, `aria-haspopup`, `aria-controls`, `aria-expanded`) pass through without being explicitly declared on the component:

```svelte
<button type="button" {role} aria-expanded={ariaExpanded} {...rest}>
```

Never hard-code or strip ARIA attributes inside shared UI components.

### 8. Testing

Query by ARIA role and label in tests, never by CSS class. This validates accessibility intent alongside behaviour:

```ts
// correct
const button = screen.getByRole('button', { name: 'Close Preferences' })

// wrong — tests implementation, not accessibility contract
const button = document.querySelector('.c-preferences__close')
```

## Consequences

**Positive:**
- Native `<dialog>` provides top-layer management, backdrop, and Escape handling without custom code
- `role="none"` on `<li>` elements keeps the ARIA tree correct for screen readers and automated audits
- `aria-expanded` on trigger buttons means screen readers announce open/closed state without custom live regions
- Testing by role catches regressions in accessibility intent, not just DOM structure

**Negative:**
- `<dialog>` `showModal()` requires a DOM reference and a `$effect` to open/close reactively — slightly more wiring than a CSS `display: none` toggle
- Icon-only buttons require `aria-label` on every instance — easy to forget and not caught by TypeScript alone
