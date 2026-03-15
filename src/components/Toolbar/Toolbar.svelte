<script lang="ts">
  import Button from '../ui/Button/Button.svelte';
  import Menu from '../ui/Menu/Menu.svelte';
  import { type EToolbarItem, menuConfig } from './Toolbar.config';

  let currentMenuOpen: EToolbarItem | null = $state(null);
  let menuRef: HTMLUListElement | undefined = $state();

  $effect(() => {
    if (currentMenuOpen && menuRef) {
      menuRef.focus();
    }
  });

  function handleOnFocusOut(e: FocusEvent & { currentTarget: HTMLUListElement }) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      currentMenuOpen = null;
    }
  }
</script>

<ul
  role="menubar"
  aria-label="Toolbar"
  tabindex={-1}
>
  {#each Object.values(menuConfig) as { id, Icon, menuItems, label }}
    <li role="none">
      <Button
        role="menuitem"
        tabindex={0}
        aria-haspopup="menu"
        aria-controls={`toolbar-menu-${id}`}
        aria-expanded={currentMenuOpen === id}
        isTransparent
        onclick={() => { currentMenuOpen = id }}
      >
        <Icon />
      </Button>
      {#if currentMenuOpen === id}
        <Menu
          {id}
          class="toolsmenu"
          ariaLabel={label}
          items={menuItems}
          bind:domRef={menuRef}
          onFocusOut={handleOnFocusOut}
        />
      {/if}
    </li>
  {/each}
</ul>

<style>
  ul[role="menubar"] {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li[role="none"] {
    padding-block: 0.8em; /* em because of block padding is affected by text size, should be attached to parent font-size */
    padding-inline: 0.4rem; /* rem because side padding is not affected by text size */
    white-space: nowrap; /* ensure menu items text does not brake line */
    overflow: hidden;
    cursor: pointer;
  }

  :global(.toolsmenu) {
    position: absolute;
    left: 3rem;
    bottom: 3rem;
  }
</style>