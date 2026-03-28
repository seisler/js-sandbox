<script lang="ts">
  import Accordion from '../../../ui/Accordion/Accordion.svelte';
  import NavigationMenu from '../NavigationMenu/NavigationMenu.svelte';
  import { navigationConfig } from './Navigation.config';
</script>

<ul role="menu" class="c-navigation">
  {#each Object.values(navigationConfig) as { id, label, menuItems }}
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