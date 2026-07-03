# ADR-FE-004: Shared Reactive State — Revealing Module Pattern with Svelte 5 Runes

## Status
Accepted

## Date
2026-06-27

## Context

Svelte 5 introduced runes (`$state`, `$derived`, `$effect`) as a compiler-level reactivity primitive. Unlike Svelte 4 stores (`writable`, `readable`), runes are not objects — they are compiler annotations that only work inside `.svelte` files and `.svelte.ts` modules.

The application needs shared reactive state that:
- Lives outside components (accessible across features, widgets, and pages)
- Keeps internal state private and mutation controlled
- Is testable in isolation without mounting a component
- Stays consistent with the no-classes convention (ADR-FE-006)

## Decision

Shared state is implemented as a **factory function using the Revealing Module Pattern**, defined in a `.svelte.ts` file.

### Structure

```ts
// shared/model/ExampleState.svelte.ts

export function createExampleState(): ExampleState {
  // private — only accessible via the returned object
  let value = $state(false);

  return {
    get value(): boolean { return value; },   // read-only getter
    setValue: (next: boolean) => { value = next; }, // controlled mutation
  };
}

// singleton for application use
export const exampleState: ExampleState = createExampleState();
```

### Rules

- **Private state via closure** — `$state` variables are declared inside the factory, never on the returned object. External code cannot mutate them directly.
- **Getters for reads** — state is exposed as `get` accessors on the returned object. This makes reads reactive (Svelte tracks the getter) while preventing direct assignment from outside.
- **Methods for writes** — mutations happen only through named action methods, making state changes explicit and traceable.
- **Factory + singleton** — the factory function (`createExampleState`) is what tests instantiate fresh per test. The singleton (`exampleState`) is what the application imports. Never skip the factory in favour of a bare module-level `$state`.
- **File extension** — state modules MUST use the `.svelte.ts` extension so the Svelte compiler processes runes. A plain `.ts` file will throw at runtime.
- **Location** — singletons live in `shared/model/` and export through `shared/model/index.ts`. Feature-scoped state that does not need to be shared lives inside the feature slice (`features/my-feature/model.svelte.ts`) and is not re-exported from `shared`.

### What this replaces

Svelte 4 `writable` / `readable` stores are not used. This pattern provides the same capability with native Svelte 5 reactivity and without the `$store` subscription syntax.

## Consequences

**Positive:**
- State is encapsulated — external code cannot accidentally bypass mutations
- The factory function makes the state fully testable without a DOM or mounted component
- Consistent with the no-classes convention — identical capability, closure-based instead
- Svelte's reactivity tracks getters automatically; no manual subscription management

**Negative:**
- The `.svelte.ts` extension is easy to forget — a misnamed `.ts` file produces a cryptic runtime error
- Getter syntax (`get value()`) is unfamiliar to developers who expect plain property access; the behaviour is identical but the declaration is not
