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
    --color-base: #fff;
    --color-base-secondary: #f38518;
    --color-btn-base: #f38518;
    --color-bg-base: #080c0e;
    --color-bg-menu-base: #181a1b;
    --color-border-base: #484538;
    --editor-font: 'Fira Code', ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
    --font-main: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
      Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 
      'Helvetica Neue', sans-serif;
  }

  /* Add styles to all app menu*/
  :global(ul[role="menu"]) {
    /*position: absolute;*/
    background-color: var(--color-bg-menu-base);
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
    background-color: var(--color-bg-base);
    overflow: hidden;
  }

  :global(body) {
    font-family: var(--font-main);
    color: var(--color-base);
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
    background-color: var(--color-bg-base);
  }

  .toolbar {
    grid-area: toolbar;
    display: flex;
    align-items: end;
    position: relative;
    background-color: var(--color-bg-base);
  }
</style>