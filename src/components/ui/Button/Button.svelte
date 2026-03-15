<script lang="ts">

  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  /* Typescript */

  type ComponentProps = {
    id?: string,
    role: string,
    children: Snippet,
    tabindex: number,
    isTransparent: boolean,
  }

  type ButtonProps = ComponentProps 
    & Omit<HTMLButtonAttributes, 'form' | 'role' | 'type' | 'tabindex' | 'id'> 

  /* State & Props */
  
  let {
    id,
    role,
    children,
    isTransparent,
    "aria-expanded": ariaExpanded,
    ...rest
  }: ButtonProps = $props();
</script>

<button
  {id}
  type="button"
  {role}
  class:transparent={isTransparent}
  aria-expanded={ariaExpanded}
  {...rest}
>
  {@render children?.()}
</button>

<style>
  button[type="button"] {
    color: var(--color-base);
    background-color: var(--color-btn-base);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5em 0.3em; /* use em because of padding should grow/shrink with the button text */
    font-family: inherit;
    font-size: 0.8rem;
    border: none;
    width: auto;
    margin-inline: 0;
    transition: transform 0.1s ease;
    user-select: none;
  
    /* Prevent blue highlight on mobile taps */
    -webkit-tap-highlight-color: transparent;
  }

  button[type="button"]:active {
    transform: scale(0.99);
  }

  button[aria-expanded=true] {
    background-color: var(--color-border-base);
  }

  .transparent {
    all: unset; /* @todo check this */
    background-color: transparent !important;
  }

  .transparent:active {
    transform: scale(0.95) !important;
  }
</style>