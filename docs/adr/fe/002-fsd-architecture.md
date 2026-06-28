# ADR-FE-002: Frontend Architecture — Feature-Sliced Design

## Status
Accepted

## Date
2026-06-27

## Context

As the frontend grows beyond a single component, it needs a file organization strategy that:

- Keeps feature code isolated so individual slices can be developed and tested independently
- Enforces a clear dependency direction — prevents circular imports and tight coupling between unrelated UI areas
- Scales predictably: adding a new feature (e.g., a package manager panel) should not require touching existing code

The app currently has four distinct UI concerns: the code editor, the toolbar (run button, settings), the execution results console, and an editor preferences panel. These will grow independently.

## Decision

Adopt [Feature-Sliced Design (FSD)](https://feature-sliced.design/) as the frontend directory structure.

### Layer structure

```
src/
  app/          # initialization only: global styles, Tauri setup, top-level layout
  pages/        # route-level components (currently one: the main editor page)
  widgets/      # composite blocks assembled from features/entities (toolbar, console)
  features/     # user-facing interactions (run-code, editor-preferences)
  entities/     # business objects and their UI (execution-result, editor-session)
  shared/       # framework-agnostic: ui kit, lib utilities, Tauri API bindings
```

### Dependency rule

Each layer may only import from layers **below** it in the list above. `features` may import from `entities` and `shared`, never from `widgets` or `pages`. Enforced via ESLint's `import/no-restricted-paths` rule.

### Slice structure

Each feature/entity/widget slice follows a public-API-first convention:

```
features/run-code/
  index.ts        # public API — only this file is imported by other layers
  model.ts        # state and business logic ($state, stores)
  ui/             # Svelte components internal to this slice
```

Consumers import from the slice root (`features/run-code`), never from internal paths (`features/run-code/model`).

### Applying FSD to this app

| Concern | Layer | Slice |
|---|---|---|
| Global layout, Tauri init | `app` | — |
| Main editor view | `pages` | `editor` |
| Toolbar, results console | `widgets` | `toolbar`, `console` |
| Run code, editor preferences | `features` | `run-code`, `editor-preferences` |
| Execution result, editor config | `entities` | `execution-result`, `editor-config` |
| Monaco wrapper, Zod schemas, Tauri invoke | `shared` | `ui`, `lib`, `api` |

## Consequences

**Positive:**
- New features are added as self-contained slices with no required changes to existing code
- The dependency rule makes circular imports structurally impossible
- Onboarding is easier — the layer name immediately signals a file's purpose and allowed imports

**Negative:**
- More directories than a flat `components/` approach — adds navigation overhead for a small app
- The public-API (`index.ts`) boundary requires discipline; tooling (ESLint rule) is needed to enforce it
- `pages` is effectively a single file for this app; the layer exists for consistency, not necessity
