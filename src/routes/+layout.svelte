<script lang="ts">
  import { Menubar } from '$widgets/Menubar';
  import { Preferences, preferencesState } from '$widgets/Preferences';
  import { Toolbar } from '$widgets/Toolbar';
  import '$shared/styles/index.css';
  
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