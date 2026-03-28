<script lang="ts">

  import Button from '../Button/Button.svelte';
  import ItemOpenIcon from './icons/ChevronOpen.svelte';
  import ItemClosedIcon from './icons/ChevronClosed.svelte';

  /* ---- State & Props */
  
  let { children, label } = $props();
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
    
    <span>{label}</span>
</Button>

{#if isExpanded}
  {@render children?.()}
{/if}