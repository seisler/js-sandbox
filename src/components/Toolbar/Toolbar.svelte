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
    <li role="none" class:selected={currentMenuOpen === id}>
      <Button
        role="menuitem"
        tabindex={0}
        aria-haspopup="menu"
        aria-controls={`toolbar-menu-${id}`}
        aria-expanded={currentMenuOpen === id}
        variant="ghost"
        align="center"
        onclick={() => { currentMenuOpen = id }}
      >
        <Icon />
      </Button>
      {#if currentMenuOpen === id}
        <Menu
          {id}
          class="toolsmenu-menu-position"
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
    white-space: nowrap; /* ensure menu items text does not brake line */
    overflow: hidden;
    cursor: pointer;
  }

  .selected {
    background-color: var(--clr-border);
  }

  :global(.toolsmenu-menu-position) {
    position: absolute;
    left: 2rem;
    bottom: 3.2rem;
  }
</style>