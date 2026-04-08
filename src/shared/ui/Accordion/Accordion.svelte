<script lang="ts">

  import { Button } from '$shared/ui/Button';
  import { ChevronOpen, ChevronClosed } from '$shared/ui/icons';
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
      <ChevronOpen size={18} />
    {:else}
      <ChevronClosed size={18} />
    {/if}
    
    <small>{label}</small>
</Button>

{#if isExpanded}
  {@render children?.()}
{/if}