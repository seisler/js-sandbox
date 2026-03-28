<script lang="ts">
  
  import Button from '$components/ui/Button/Button.svelte';

  /* ---- State & Props ---- */

  let { items } = $props();
</script>

<ul role="menu" class="c-navigation-menu">
  {#each items as menuItem}
    <li role="none" class="c-navigation-menu__item">
      <Button
        role="menuitem"
        tabindex={0}
        variant="ghost"
        align="center"
        onclick={() => console.log('click on navigation menu item ', menuItem.label)}
      >
        {menuItem.label}
      </Button>
    </li>
  {/each}
</ul>

<style>
  .c-navigation-menu {
    padding-inline-start: 2rem;
  }
</style>