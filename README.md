# JS Sandbox

A desktop JavaScript/TypeScript sandbox IDE — write and run code instantly, without a browser or an online tool.

> **Status:** Released — **v0.1.0** available for Windows, macOS, and Linux.
> **[⬇ Download the latest release](https://github.com/seisler/js-sandbox/releases/latest)**

---

## Why

Existing online sandboxes require a browser tab and an internet connection, and often paywall npm packages behind a subscription. This is a native desktop app — lightweight, offline-first, with external dependency support, and fast.

---

## Download & Install

Grab the installer for your platform from the [**latest release**](https://github.com/seisler/js-sandbox/releases/latest):

| Platform | File |
|---|---|
| Windows | `.exe` (NSIS installer) |
| macOS | `.dmg` |
| Linux | `.deb` |

> **Note:** builds are not yet code-signed, so on first launch you may see a warning:
> - **Windows** — SmartScreen: click *More info → Run anyway*.
> - **macOS** — Gatekeeper: right-click the app → *Open*, then confirm.

---

## Features

- **Instant execution** — write JS/TS in a Monaco editor and run it in an isolated V8 runtime on the Rust backend.
- **npm packages** — search the npm registry live, add packages, and use them in your code.
- **Native & offline-first** — no browser tab, no account, works without an internet connection (except live npm search).
- **Configurable editor** — themes, fonts, and editor preferences.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | [Tauri v2](https://tauri.app/) (Rust) |
| Code execution | [deno_core](https://crates.io/crates/deno_core) (sandboxed V8) |
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
src-tauri/       # Rust backend (Tauri commands, sandboxed code execution)
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

## Releases

Releases are built automatically by a GitHub Actions pipeline. Pushing a `v*` tag builds native installers for Windows, macOS, and Linux in parallel and attaches them to a draft GitHub Release for review before publishing. See [`.github/workflows/release.yml`](.github/workflows/release.yml).

---

## Roadmap

- [x] Code execution via Rust backend
- [x] npm packages feature — add/remove packages and use them in code
- [x] Automated release pipeline with cross-platform builds
- [ ] Inject npm package types into Monaco Editor for autocompletion
- [ ] Expanded test coverage and end-to-end testing
- [ ] Full accessibility audit — keyboard and arrow navigation for menus
- [ ] Hard memory limit for the JS engine via V8 OOM callback
- [ ] Code signing / notarization for signed installers
