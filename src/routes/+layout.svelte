<script lang="ts">
  import { Menubar } from '$widgets/Menubar';
  import { Preferences, preferencesState } from '$widgets/Preferences';
  import { Toolbar } from '$widgets/Toolbar';
  
  /* ---- State ---- */
  let { children } = $props();
  let dialogRef: HTMLDialogElement | undefined = $state();
</script>

<div role="application" class="l-application">
  <div class="l-menubar">
    <Menubar />
  </div>
  <div class="l-toolbar">
    <Toolbar />
  </div>
  <main>
    {@render children?.()}
  </main>
</div>

{#if preferencesState.isOpen }
  <Preferences bind:domRef={dialogRef} />
{/if}

<style>

  /* ---- Fonts ---- */

  @font-face {
    font-family: 'Fira Code';
    src: url('/fonts/FiraCode-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Jetbrains Mono';
    src: url('/fonts/JetBrainsMono-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Source Code Pro';
    src: url('/fonts/SourceCodePro-Regular.otf.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  /* ---- GLOBAL STYLES ---- */

  /* CSS Token */
  :global(:root) {
    /* --- TYPOGRAPHY --- */
    --font-family-mono: 'Fira Code', ui-monospace, monospace;
    --font-family-sans: system-ui, -apple-system, sans-serif;

    /* --- COLORS (BRAND) --- */
    --clr-brand: #f38518;
    
    /* --- COLORS (INTERFACES) --- */
    --clr-bg-main: #080c0e;      /* Deep background */
    --clr-bg-surface: #181a1b;   /* Menus, cards, modals */
    
    --clr-txt-main: #ffffff;
    --clr-txt-contrast: #000000;
    --clr-txt-muted: #a0a0a0;    /* For secondary text */
    --clr-txt-error: #DB1A1A;

    --clr-border: #484538;

    /* --- COMPONENT ALIASES --- */
    --btn-primary-bg: var(--clr-brand);
    --btn-primary-txt: var(--clr-bg-main);
  }

  :global(html, body) {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
    background-color: var(--clr-bg-main);
    overflow: hidden;
  }

  :global(body) {
    font-family: var(--font-family-sans);
    color: var(--clr-txt-main);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Unset some UL defaults for menu and menubar */
  :global(ul[role="menu"], ul[role="menubar"]) {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .l-application {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      "menubar menubar"
      "toolbar main";
    height: 100vh;
    width: 100vw;
  }

  .l-application > * {
    min-width: 0;
    min-height: 0;
  }

  main {
    grid-area: main;
    display: flex;
  }
  
  .l-menubar {
    grid-area: menubar;
    background-color: var(--clr-bg-main);
  }

  .l-toolbar {
    grid-area: toolbar;
    display: flex;
    align-items: end;
    position: relative;
    background-color: var(--clr-bg-main);
  }
</style>