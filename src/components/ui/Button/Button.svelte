<script lang="ts">

  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  /* ---- Typescript ---- */

  type ComponentProps = {
    id?: string,
    role?: string,
    children: Snippet,
    tabindex?: number, // Only buttons from a menu should have tabindex. Button's tabindex default is 0.
    variant?: 'normal' | 'ghost',
    align?: 'start' | 'center' | 'end',
    class?: string,
  }

  type ButtonProps = ComponentProps 
    & Omit<HTMLButtonAttributes, 'form' | 'role' | 'type' | 'tabindex' | 'id'> 

  /* ---- State & Props ---- */
  
  let {
    id,
    role,
    children,
    variant,
    align,
    class: className = '',
    'aria-expanded': ariaExpanded,
    ...rest
  }: ButtonProps = $props();
</script>

<button
  {id}
  type="button"
  {role}
  class="{variant} align-{align} {className}"
  aria-expanded={ariaExpanded}
  {...rest}
>
  {@render children?.()}
</button>

<style>
  button[type="button"] {
    width: 100%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    /* use em because of padding should grow/shrink with the button text */
    padding: 0.5em 0.3em;
    font-family: inherit;
    font-size: 0.8rem;
    border: none;
    margin-inline: 0;
    transition: transform 0.1s ease;
    user-select: none;
  
    /* Prevent blue highlight on mobile taps */
    -webkit-tap-highlight-color: transparent;
  }

  /* ---- Variants ---- */

  .normal {
    color: var(----clr-txt-main);
    background-color: var(--btn-primary-bg);
  }

  .normal:active {
    transform: scale(0.99);
  }

  button[aria-expanded=true] {
    background-color: var(--clr-border);
  }

  .ghost {
    /* all: unset; @todo check this when A11y will be revised */
    color: var(----clr-txt-main);
    background-color: transparent !important;
  }

  .ghost:active {
    transform: scale(0.95) !important;
  }

  /* ---- Content Position ---- */
  
  .align-start {
    justify-content: start;
  }

  .align-center {
    justify-content: center;
  }

  .align-end {
    justify-content: end;
  }
</style>