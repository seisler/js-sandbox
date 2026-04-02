<script lang="ts">
  import { fly } from 'svelte/transition';
  import Button from '$shared/ui/Button/Button.svelte';
  import type { MenuProps } from './Menu.types';

  /* ---- Props & State ---- */
  
  let {
    id,
    ariaLabel,
    items,
    class: className = '',
    onfocusout,
    domRef = $bindable()
  }: MenuProps = $props();

</script>

<ul
  {id}
  class={`${className} c-menu`}
  role="menu"
  aria-label={ariaLabel}
  tabindex={-1}
  transition:fly={{ y: -10, duration: 200 }}
  {onfocusout}
  bind:this={domRef}
>
  {#each items as { id, label, onclick } }
    <li role="none" class="c-menu__item">
      <Button
        role="menuitem"
        class="c-menu__button"
        align="start"
        tabindex={-1}
        variant="ghost"
        {onclick}
      > 
        {label}
      </Button>
    </li>
  {/each}
</ul>

<style>
  .c-menu {
    padding: 0.2rem 0.1em;
    background-color: var(--clr-bg-surface);
    min-width: 200px;
    line-height: 1.2;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.01), 
              0 10px 25px rgba(0, 0, 0, 0.5);
    font-size: 0.8rem;
    /* fixed size for solid borders */
    border-radius: 4px;
    z-index: 100;
    padding-inline-start: 0;
    border: none;
  }

  .c-menu__item {
    display: flex;
    cursor: default;
    padding-block: 0.1em;
    padding-inline: 0.5rem;
  }

  .c-menu__item:hover {
    background-color: var(--clr-border);
    border-radius: 2px;
  }

  :global(.c-menu__button) {
    width: 100% !important;
  }
</style>