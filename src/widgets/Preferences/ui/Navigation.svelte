<script lang="ts">
  import { Accordion } from '$shared/ui/Accordion';
  import NavigationMenu from './NavigationMenu.svelte';
  import { navigationConfig } from '../config/Navigation.config';
</script>

<ul role="menu" class="c-navigation">
  {#each Object.values(navigationConfig) as { label, menuItems }}
    <li role="none">
      <Accordion {label}>
        <NavigationMenu items={menuItems} />
      </Accordion>
    </li>
  {/each}
</ul>

<style>
  .c-navigation {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }
</style>