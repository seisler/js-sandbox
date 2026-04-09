# JS Sandbox

A desktop JavaScript/TypeScript sandbox IDE — write and run code instantly, without a browser or an online tool.

> **Status:** Early development — not yet available for download. Follow the project for updates.

---

## Why

Existing online sandboxes require a browser tab and an internet connection and pay for subscriptions when add npm packages. This is a native desktop app — lightweight, offline-first, with external dependencies support, and fast.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | [Tauri v2](https://tauri.app/) (Rust) |
| Frontend | [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) |
| Language | TypeScript (strict) |
| Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Architecture | [Feature-Sliced Design](https://feature-sliced.design/) |

### Why Tauri over Electron?

Tauri uses the OS's native webview instead of bundling Chromium, resulting in significantly smaller binary sizes and lower memory usage. Tauri also allows to use different BE and FE solutions.

### Why Rust?

Rust is the natural choice for Tauri's desktop target. Unlike Swift (macOS-only) or Kotlin (Android-focused), Rust compiles natively on Windows, macOS, and Linux without platform-specific overhead or toolchain complexity. Memory safety without a garbage collector also means the code execution engine stays fast and predictable.

### Why Svelte 5?

Svelte 5 compiles components to vanilla JavaScript at build time — no virtual DOM, no runtime framework overhead. The result is smaller bundles and faster execution compared to React or Vue. Combined with Tauri's native webview, the app stays lean end to end.

### Why Feature-Sliced Design?

FSD enforces a strict layer hierarchy that prevents circular dependencies and makes the codebase predictable as it grows. Each layer can only import from layers below it — no exceptions.

---

## Architecture

```
src/
  widgets/       # Composed UI blocks (Editor, Menubar, Toolbar, Preferences...)
  features/      # User-facing interactions (run-code, update-editor-preferences)
  shared/        # Reusable primitives (ui, model, config, styles)
  pages/         # Page components
  routes/        # SvelteKit routing (app entry point)
src-tauri/       # Rust backend (Tauri commands, code execution)
```

---

## Development

```bash
npm run tauri dev      # Start full desktop app (frontend + Rust backend)
npm run dev            # Frontend only (Vite dev server)
npm run check          # Svelte + TypeScript type checking
npm run lint           # ESLint
npm run test           # Vitest unit tests
```

**Requirements:** [Node.js](https://nodejs.org/), [Rust](https://rustup.rs/), [Tauri prerequisites](https://tauri.app/start/prerequisites/)

---

## Roadmap

- [ ] Code execution via Rust backend
- [ ] npm packages feature — add/remove packages and inject their types into Monaco Editor
- [ ] Expanded test coverage
- [ ] Full accessibility audit — keyboard and arrow navigation for menus
- [ ] End-to-end testing
- [ ] Automated release pipeline with cross-platform builds
