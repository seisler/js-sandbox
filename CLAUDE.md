# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (frontend only)
npm run tauri dev    # Start full Tauri desktop app (frontend + Rust backend)
npm run build        # Build frontend for production
npm run tauri build  # Build distributable desktop app
npm run check        # Type-check Svelte + TypeScript
npm run check:watch  # Type-check in watch mode
```

## Architecture

This is a **desktop JavaScript sandbox IDE** built with **Tauri v2 + SvelteKit + Svelte 5**.

**Two separate codebases:**
- `src/` — SvelteKit frontend (TypeScript, compiled to static HTML via `adapter-static`)
- `src-tauri/` — Rust/Tauri backend (minimal; handles OS-level capabilities)

The frontend is pre-rendered as static files (no Node server) because Tauri bundles the app directly. Vite runs on port 1420 in dev mode.

**Frontend structure:**
- `src/routes/+layout.svelte` — root shell with Menubar and Toolbar
- `src/routes/+page.svelte` — main view: Editor (left 70%) + ResultsConsole (right 30%)
- `src/components/Editor/` — Monaco Editor instance (language: TypeScript, theme: `hc-black`)
- `src/components/ResultsConsole/` — output panel; `handleOnPlayClick()` is where code execution will be wired
- `src/components/Preferences/` — settings dialog with its own state (`createPreferencesState()`)
- `src/components/ui/` — reusable primitives (Button, Menu, Accordion, etc.)

**Svelte 5 runes** are used throughout (`$state`, `$effect`, `$props`). Do not use the legacy Svelte 4 reactivity API (`$:`, `export let`, stores).

**State pattern:** component-local state via runes; shared state via factory functions (e.g., `createPreferencesState()`), not Svelte stores.

**Styling:** CSS custom properties, dark theme by default. Brand color: `#f38518` (orange). Background: `#080c0e`.

**Monaco Editor workers** are pre-configured in `vite.config.js` for TypeScript, JSON, CSS, and HTML languages — do not restructure those `optimizeDeps` entries.

## Current Status

Early development (v0.1.0). Code execution is not yet implemented — `handleOnPlayClick()` in ResultsConsole is the entry point to wire up. The Rust backend (`src-tauri/src/lib.rs`) currently only has a placeholder `greet` command.

# Code Style
- 2-space indentation
- TypeScript only, no `any`
- Components in src/components/
- UI shared components in src/components/ui