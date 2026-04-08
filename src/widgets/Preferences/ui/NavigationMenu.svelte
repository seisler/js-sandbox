<script lang="ts">
  
  import { Button } from '$shared/ui/Button';

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
        onclick={menuItem.onclick}
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