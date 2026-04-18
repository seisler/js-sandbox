<script lang="ts">

  import type { ButtonProps } from './Button.type';
  
  let {
    id,
    role,
    children,
    variant = 'normal',
    align = 'center',
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
    width: auto;
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
    color: var(--clr-txt-main);
    background-color: var(--btn-primary-bg);
  }

  .normal:active {
    transform: scale(0.99);
  }

  button[aria-expanded=true] {
    background-color: var(--clr-border);
  }

  .ghost {
    color: var(--clr-txt-main);
    background-color: transparent !important;
  }

  .ghost:active {
    transform: scale(0.95) !important;
  }

  .ghost:focus {
    outline: none;
    text-decoration: none;
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