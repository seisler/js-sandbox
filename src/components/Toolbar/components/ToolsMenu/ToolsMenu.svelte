<script lang="ts">
  import Button from '../../../ui/Button/Button.svelte';
  import { fly } from 'svelte/transition';

  /* Typescript */

  type ToolsMenuProps = {
    domRef: HTMLUListElement | undefined,
    handleOnFocusOut: (e: FocusEvent & { currentTarget: HTMLUListElement }) => void,
  }

  /* State & Props */

  let { domRef = $bindable(), handleOnFocusOut }: ToolsMenuProps = $props();

</script>

<ul
  role="menu"
  aria-label="Tools menu"
  bind:this={domRef}
  transition:fly={{ y: -10, duration: 200 }}
  onfocusout={handleOnFocusOut}
  tabindex={-1}
>
  <li role="none">
    <Button
      role="menuitem"
      tabindex={-1}
      isTransparent
      aria-haspopup="menu"
      onclick={() => console.log('clicked THEME menu item')}
    >
      Theme
    </Button>
  </li>
  <li role="none">
    <Button
      role="menuitem"
      tabindex={-1}
      isTransparent
      aria-haspopup="menu"
      onclick={() => console.log('clicked SETTINGS menu item')}
    >
      Settings
    </Button>
  </li>
  <li role="none">
    <Button
      role="menuitem"
      tabindex={-1}
      isTransparent
      aria-haspopup="menu"
      onclick={() => console.log('clicked UPDATES menu item')}
    >
      Check for updates
    </Button>
  </li>
</ul>

<style>
  ul[role="menu"] {
    position: absolute;
    bottom: 3.5rem;
    left: 2rem;
  }

  ul[role="menu"] > li:nth-last-child(1) {
    border-top: 0.1px solid var(--color-base);
    margin-top: 1em;
  }
</style>