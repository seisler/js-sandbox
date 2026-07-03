# ADR-FE-006: Functional Programming Style — No Classes, No Parameter Mutation, Pure Logic Separated from Reactive Shells

## Status
Accepted

## Date
2026-07-04

## Context

The frontend is TypeScript throughout, and Svelte 5 runes already push state management toward closures and factory functions rather than classes (ADR-FE-004). Without an explicit rule, nothing stops a class from creeping in elsewhere — a validator, a small utility, a future service wrapper — each one a small inconsistency that compounds over time and makes the codebase's mental model less predictable (readers now have to ask "is this a class or a closure?" file by file).

Separately, state-heavy code (add/remove/update-style actions) is tempted to mutate arrays and objects in place (`.push`, `.splice`, direct field assignment) because it "feels natural" next to `$state`. This makes behaviour harder to unit test in isolation (mutating logic is entangled with the reactive container it happens to live in) and makes bugs from aliased references more likely.

This came up concretely while planning the `PackageBindings` state model (spec 002): the add/remove/update-alias transition rules needed to be validated by unit tests (ADR-002, TDD) independent of whether they were wired into a `$state` container yet.

## Decision

All JS/TS code in this project follows a functional style:

1. **No classes.** Use plain functions and closures. Shared reactive state uses the factory + Revealing Module Pattern (ADR-FE-004); anything else that used to reach for a class (a validator, a small stateless helper) is a function or a plain object of functions instead.
2. **No parameter mutation.** Functions never mutate their arguments — arrays, objects, or otherwise. They return a new value. `list.filter(...)`, `list.map(...)`, and `[...list, x]` are the norm; `.push`, `.splice`, and direct index/field assignment on a parameter are not used.
3. **Pure logic is separated from side-effecting/reactive shells.** Business rules (validation, transitions, derivations) are extracted into plain functions with no dependency on Svelte reactivity — `(input) => output`, throwing on invalid input. The `.svelte.ts` reactive module that owns the `$state` container is a thin shell: it holds the state variable and reassigns it from the pure function's return value. It contains no branching/validation logic of its own.
4. **Guard clauses over nested conditionals.** Validate and return/throw early at the top of a function.
5. **Maps/plain objects over if/else or switch chains** when branching on a fixed set of discrete values (e.g., a lookup table keyed by name, not a chain of `if (name === ...)`).

### Example: pure transition function + thin reactive shell

```ts
// PackageBindings.transitions.ts — pure, no Svelte dependency, trivially unit-testable
export function addBinding(list: PackageBinding[], binding: PackageBinding): PackageBinding[] {
  if (!binding.package || !binding.alias) throw new Error('package and alias must be non-empty');
  if (list.some((b) => b.package === binding.package)) return list; // no-op, not a mutation
  return [...list, binding];
}
```

```ts
// PackageBindings.svelte.ts — thin reactive shell, delegates to the pure function
export function createPackageBindingsState(): PackageBindingsState {
  let packages = $state<PackageBinding[]>([]);

  return {
    get packages(): PackageBinding[] { return packages; },
    addPackage: (binding: PackageBinding) => { packages = addBinding(packages, binding); },
  };
}
```

## Consequences

**Positive:**
- One consistent mental model for "how state and logic are written" across the whole frontend — no class-vs-closure judgment calls
- Pure transition/validation functions can be unit tested with plain input/output assertions — no component mount, no reactive test harness, faster and simpler tests (directly supports ADR-002's TDD cycle)
- No parameter mutation removes an entire category of aliasing bugs (a caller's array/object being silently changed out from under it)
- Business rules are portable — they do not depend on Svelte and could be reused or moved without touching reactivity code

**Negative:**
- Slightly more files per feature (a `*.transitions.ts` alongside the `*.svelte.ts` shell) instead of one file with everything inline
- Returning new arrays/objects instead of mutating in place has a minor allocation cost — irrelevant at this app's scale (session-scoped lists of a handful of items), but a real tradeoff at large scale
- Developers coming from an OOP background need to unlearn instinctive `class` usage; the factory/closure pattern (ADR-FE-004) and this ADR together are the reference for what to do instead
