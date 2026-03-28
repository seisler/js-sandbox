<script lang="ts">

  import Button from '$components/ui/Button/Button.svelte';
  import ItemOpenIcon from './icons/ChevronOpen.svelte';
  import ItemClosedIcon from './icons/ChevronClosed.svelte';
  import type { AccordionProps } from './Accordion.type';

  /* ---- State & Props */
  
  let { children, label }: AccordionProps = $props();
  let isExpanded = $state(false);
</script>

<Button
  class="c-accordion__button"
  role="menuitem"
  aria-expanded={isExpanded} 
  variant="ghost"
  tabindex={-1}
  onclick={() => isExpanded = !isExpanded}
>
    {#if isExpanded}
      <ItemOpenIcon size={18} />
    {:else}
      <ItemClosedIcon size={18} />
    {/if}
    
    <small>{label}</small>
</Button>

{#if isExpanded}
  {@render children?.()}
{/if}