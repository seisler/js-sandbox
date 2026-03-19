<script lang="ts">
  import { fly } from 'svelte/transition';
  import Button from '../Button/Button.svelte';
  import type { MenuProps } from './Menu.types';

  /* ---- Props & State ---- */
  
  let {
    id,
    ariaLabel,
    items,
    class: cls,
    onFocusOut,
    domRef = $bindable()
  }: MenuProps = $props();

</script>

<ul
  {id}
  class={cls}
  role="menu"
  aria-label={ariaLabel}
  tabindex={-1}
  transition:fly={{ y: -10, duration: 200 }}
  onfocusout={onFocusOut}
  bind:this={domRef}
>
  {#each items as { id, text } }
    <li role="none">
      <Button
        role="menuitem"
        tabindex={-1}
        variant="ghost"
        onclick={() => console.log('click on: ', id)}
      > 
        {text}
      </Button>
    </li>
  {/each}
</ul>

<style>
  ul[role="menu"] {
    padding: 0.2rem 0.1em;
  }

  li[role="none"] {
    display: flex;
    cursor: default;
    padding-block: 0.1em;
    padding-inline: 0.5rem;
  }

  li[role="none"]:hover {
    background-color: var(--clr-border);
    border-radius: 2px;
  }
</style>