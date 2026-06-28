# ADR-FE-001: Frontend Tech Stack

## Status
Accepted

## Date
2026-06-27

## Context

The application frontend needs:

- A component framework for building the editor UI, toolbar, preferences panel, and results console
- A code editor component with syntax highlighting and autocompletion for JavaScript
- Runtime validation for user-facing configuration (editor preferences)
- A test setup compatible with Svelte components

The frontend runs inside Tauri's WebView, so it is a standard web environment — any modern framework works.

## Decision

### Framework: SvelteKit 5 + TypeScript

SvelteKit 5 with Svelte's runes reactivity model (`$state`, `$derived`). TypeScript throughout.

Chosen over React/Vue because:
- Svelte compiles to vanilla JS — no virtual DOM overhead in a desktop app
- Runes provide fine-grained reactivity without hooks complexity
- Smaller runtime footprint matters less than in mobile, but the simpler mental model is a consistent win
- SvelteKit's file-based routing maps cleanly onto Tauri's static adapter

### Code Editor: Monaco Editor

The same editor engine that powers VS Code. Provides JavaScript syntax highlighting, autocompletion, and a familiar UX out of the box. No viable alternative offers the same feature depth for a code-focused app.

### Validation: Zod

Schema-first validation for editor preferences (font size, tab width, theme, etc.). Chosen for its TypeScript-first design — schemas are the source of truth for both runtime validation and static types.

### Testing: Vitest + Testing Library

Vitest for speed (native ESM, no transpilation overhead). `@testing-library/svelte` for component tests — encourages testing behavior over implementation. Tests are colocated with their component (`Button.test.ts` next to `Button.svelte`).

### Bundler: Vite 8

Default for SvelteKit. Fast HMR during development, straightforward static build output for Tauri's `beforeBuildCommand`.

## Consequences

**Positive:**
- Svelte 5 runes eliminate boilerplate reactivity patterns
- Monaco gives a professional editor experience with zero custom work
- Zod schemas serve as both validation and TypeScript type source — no duplication
- Vitest runs in milliseconds for unit/component tests

**Negative:**
- Monaco is a large dependency (~4 MB minified) — acceptable for a desktop app, would be a problem in a web context
- Svelte 5 runes are a recent API — some ecosystem libraries still target Svelte 4
- SvelteKit adds routing infrastructure that is mostly unused in a single-page desktop app (only one route exists)
