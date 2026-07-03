# js-sandbox

A desktop JavaScript sandbox built with Tauri 2. Users write JS in a Monaco editor, hit run, and see output in a results console. Execution happens in an isolated V8 runtime on the Rust backend.

## Architecture decisions

| ADR | Topic |
|---|---|
| [ADR-001](docs/adr/001-platform.md) | Platform — Tauri 2 desktop app |
| [ADR-002](docs/adr/002-tdd.md) | Process — Test-Driven Development (enforced for AI agents) |
| [ADR-BE-001](docs/adr/be/001-be-stack.md) | Backend — Rust + deno_core sandboxed JS execution |
| [ADR-BE-002](docs/adr/be/002-npm-package-injection.md) | Backend — npm packages via UI-driven global injection |
| [ADR-BE-003](docs/adr/be/003-error-handling.md) | Backend — `anyhow` in core, `String` at Tauri boundary |
| [ADR-BE-004](docs/adr/be/004-command-layer.md) | Backend — Tauri command handlers as thin adapters |
| [ADR-BE-005](docs/adr/be/005-raii-drop-cleanup.md) | Backend — RAII via `Drop` for guaranteed cleanup |
| [ADR-FE-001](docs/adr/fe/001-fe-stack.md) | Frontend — SvelteKit 5 + Monaco + Zod + Vitest |
| [ADR-FE-002](docs/adr/fe/002-fsd-architecture.md) | Frontend structure — Feature-Sliced Design |
| [ADR-FE-003](docs/adr/fe/003-css-bem.md) | Frontend CSS — BEM with `c-` (component) and `l-` (layout) prefixes |
| [ADR-FE-004](docs/adr/fe/004-reactive-state-pattern.md) | Frontend state — Revealing Module Pattern with Svelte 5 runes (`.svelte.ts`) |
| [ADR-FE-005](docs/adr/fe/005-accessibility.md) | Frontend accessibility — semantic HTML, ARIA roles, focus management |
| [ADR-FE-006](docs/adr/fe/006-functional-programming.md) | Frontend style — no classes, no parameter mutation, pure logic separated from reactive shells |

## Commands

```bash
# Frontend dev server
npm run dev

# Type checking
npm run check

# Tests (run once)
npm run test

# Tests (watch mode)
npm run test:watch

# Lint
npm run lint

# Full desktop app (dev)
npm run tauri dev

# Full desktop app (release build)
npm run tauri build
```

## Frontend structure (FSD)

The `src/` directory follows Feature-Sliced Design. Each layer may only import from layers below it.

```
src/
  routes/       # SvelteKit routing (thin wrappers over pages/)
  pages/        # Full-page layouts (HomePage)
  widgets/      # Composite UI blocks (Editor, Toolbar, ResultsConsole, Preferences, Menubar)
  features/     # User interactions (run-code, update-editor-preferences)
  shared/
    ui/         # Primitive UI components (Button, Accordion, Menu, icons)
    model/      # Global app state via Svelte 5 runes ($state)
    config/     # Zod schemas and constants (EditorPreferences)
    styles/     # Global CSS (tokens, resets, base)
    api/        # Tauri invoke bindings
```

Each slice exports only through its `index.ts`. Import the slice root, never internal paths:

```ts
// correct
import { runCode } from '$features/run-code'

// wrong
import { runCode } from '$features/run-code/api/runCode'
```

## Backend structure (Rust)

```
src-tauri/src/
  main.rs           # Entry point (minimal)
  lib.rs            # Tauri builder, registers Tauri commands
  executor.rs       # V8/deno_core runtime, sandboxing, resource limits
  commands/
    execution.rs    # #[tauri::command] execute_js(code: String)
```

The `execute_js` command is the only IPC surface between frontend and backend. It accepts a JS string and returns `Result<String, String>`.

## Spec-kit (spec-driven development)

Specs, plans, and tasks live in `.specify/`. Use these slash commands in order:

1. `/speckit-constitution` — establish project principles
2. `/speckit-specify` — write a feature spec
3. `/speckit-plan` — generate an implementation plan
4. `/speckit-tasks` — break the plan into tasks
5. `/speckit-implement` — execute with the AI agent

For additional context about the current feature being built, read the current plan in `.specify/`.

<!-- SPECKIT START -->
**Current feature plan**: [specs/002-package-binding-state/plan.md](specs/002-package-binding-state/plan.md)
<!-- SPECKIT END -->

## Coding conventions

- **No classes** — use functions and closures in all JS/TS code
- **Svelte 5 runes** — `$state`, `$derived`, `$effect` for all reactive state; no Svelte 4 stores
- **Zod schemas** are the source of truth for both runtime validation and TypeScript types
- **Tests colocated** — `Button.test.ts` lives next to `Button.svelte`, not in a separate `__tests__/` directory
- **Slice public API** — all cross-slice imports go through the slice's `index.ts`
- **Guard clauses** — validate and return early at the top of a function; avoid nested if/else chains
- **Maps over if/else** — use a `Map` or plain object lookup for branching on discrete values instead of if/else or switch chains
- **No `any`** — use `unknown` and narrow it, or model the type properly; `any` silently disables type safety
- **Explicit return types** — all exported functions declare their return type explicitly
- **Named exports only** — no default exports; keeps imports consistent and refactoring safe
- **Single responsibility** — if you need "and" to describe what a function does, split it
- **No parameter mutation** — never mutate function arguments; return a new value instead
- **`$props()` first** — always destructure `$props()` at the top of `<script>` before any logic
- **Event prop naming** — event handler props follow the native DOM convention: `onclick`, `onclose`, `onfocusout`
- **No magic values** — extract inline numbers and strings to a named constant or config object; use `as const` on config objects to preserve literal types
- **`?` over `unwrap`** — in Rust, propagate errors with `?`; never use `.unwrap()` or `.expect()` outside of tests
