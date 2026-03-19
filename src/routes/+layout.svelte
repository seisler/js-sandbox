<script lang="ts">
    import Menubar from "../components/Menubar/Menubar.svelte";
    import Toolbar from "../components/Toolbar/Toolbar.svelte";
    
    let { children } = $props();
</script>

<div role="application" class="application-container">
  <div class="menubar">
    <Menubar />
  </div>
  <div class="toolbar">
    <Toolbar />
  </div>
  <main>
    {@render children()}
  </main>
</div>

<style>
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
    --clr-txt-muted: #a0a0a0;    /* For secondary text */

    --clr-border: #484538;

    /* --- COMPONENT ALIASES --- */
    --btn-primary-bg: var(--clr-brand);
    --btn-primary-txt: var(--clr-bg-main);
  }

  /* Add styles to all app menu*/
  :global(ul[role="menu"]) {
    background-color: var(--clr-bg-surface);
    min-width: 200px;
    line-height: 1.2;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.01), 
              0 10px 25px rgba(0, 0, 0, 0.5);
    font-size: 0.8rem;
    border-radius: 4px; /* fixed size for solid borders */
    z-index: 100;
    padding-inline-start: 0;
    border: none;
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
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(ul[role="menu"], ul[role="menubar"]) {
    list-style: none;
    margin: 0;
  }

  .application-container {
    display: grid;
    grid-template-rows: auto 1fr;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      "menubar menubar"
      "toolbar main";
    height: 100vh;
    width: 100vw;
  }

  .application-container > * {
    min-width: 0;
    min-height: 0;
  }

  main {
    grid-area: main;
    display: flex;
  }
  
  .menubar {
    grid-area: menubar;
    background-color: var(--clr-bg-main);
  }

  .toolbar {
    grid-area: toolbar;
    display: flex;
    align-items: end;
    position: relative;
    background-color: var(--clr-bg-main);
  }
</style>