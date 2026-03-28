<script lang="ts">
  import { fly } from 'svelte/transition'
  import Button from '../ui/Button/Button.svelte';
  import { preferencesState } from './Preferences.svelte.ts';
  import CloseIcon from './icons/CloseIcon.svelte';
  import Navigation from './components/Navigation/Navigation.svelte';
  import EditorSettingsForm from './form/EditorSettingsForm.svelte';

  /* ---- State ---- */
  
  let { domRef = $bindable() } = $props();

  /**
   * As <dialog> is opened via JS with showModal method.
   * Browser promotes the dialog on the Top Layer (https://developer.mozilla.org/en-US/docs/Glossary/Top_layer)
   * and apply custom functionality like: inert background, absolute positioning, backdrop pseudo-element...
   */
  $effect(() => {
    if (preferencesState.isOpen && domRef) {
      domRef?.showModal();
    } else {
      domRef?.close();
    }
  })

  /* ---- Javascript ---- */

  function handleOnClose() {
    domRef?.close();
    preferencesState.close();
  }

  function handleOnKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') handleOnClose();
  }
</script>

<dialog
  class="l-preferences c-preferences"
  bind:this={domRef}
  transition:fly={{ y: -10, duration: 200 }}
  onkeydown={handleOnKeyDown}
>
  <nav class="l-preferences__nav">
    <Navigation />
  </nav>
  <main class="l-preferences__form c-preferences__form">
    <header class="l-preferences__form-header">
      <h1 class="c-preferences__title">Settings</h1>
      <Button
        tabindex={-1}
        aria-label="Close Preferences"
        variant="ghost"
        onclick={handleOnClose}
        class="c-preferences__close"
      >
        <CloseIcon strokeWidth={0.5} />
      </Button>
    </header>
    <EditorSettingsForm />
  </main>
</dialog>

<style>

  /* ---- Layout Styles ---- */

  .l-preferences {
    display: flex;
    gap: 0.5rem;
    width: 40%;
    min-width: 600px;
    height: 60%;
  }

  .l-preferences::backdrop {
    backdrop-filter: blur(2px);
  }

  .l-preferences__nav {
    width: 30%;
    overflow: auto;
  }

  .l-preferences__form {
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: auto;
  }

  .l-preferences__form-header {
    display: flex;
    position: sticky;
    top: 0;
    justify-content: space-between;
    background-color: var(--clr-bg-surface);
    z-index: 1;
  }

  /* ---- Component Styles ---- */

  .c-preferences {
    background-color: var(--clr-bg-main);
    border: none;
    color: var(--clr-txt-main);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.01), 0 10px 25px rgba(0, 0, 0, 0.5);
    border-radius: 2px;
  }

  .c-preferences__form {
    background-color: var(--clr-bg-surface);
    padding-inline-start: 3rem;
  }

  /* ---- Children Styles ---- */

  :global(.c-preferences__close) {
    width: auto;
    cursor: pointer;
  }
</style>