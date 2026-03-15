<script lang="ts">
  import Button from '../ui/Button/Button.svelte';
  import Menu from '../ui/Menu/Menu.svelte';
  import { EMenubarItem, menuConfig } from './Menubar.config';

  /* Typescript */

  type CurrentMenuItem = EMenubarItem | null;

  /* State & Props */

  let currentItemMenuOpened: CurrentMenuItem = $state(null);
  let menuRef: HTMLUListElement | undefined = $state();

  $effect(() => {
    if (currentItemMenuOpened && menuRef) {
      menuRef.focus();
    }
  })

  /* Javascript */
  
  /* Remove opened menu from DOM on focus lost */
  function handleOnFocusOut(e: FocusEvent & { currentTarget: HTMLUListElement }) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      currentItemMenuOpened = null;
    }
  }
</script>

<ul role="menubar" aria-label="Actions menu">
  {#each Object.values(menuConfig) as menubarItem}
    <li role="none" class:is-open={currentItemMenuOpened === menubarItem.id}>
      <Button
        id={`actionsbar-item-${menubarItem.id}`}
        role="menuitem"
        tabindex={0}
        aria-haspopup="menu"
        aria-controls={`actionsbar-menu-${menubarItem.id}`}
        aria-expanded={currentItemMenuOpened === menubarItem.id}
        isTransparent
        onclick={() => {currentItemMenuOpened = menubarItem.id}}
      >
        {menubarItem.id}
      </Button>

      {#if currentItemMenuOpened ===  menubarItem.id}
        <Menu
          id={`actionsbar-menu-${menubarItem.id}`}
          class="menubar-menu-position"
          onFocusOut={handleOnFocusOut}
          ariaLabel={`${menubarItem.id} option menu`}
          items={menubarItem.menuItems || []}
          bind:domRef={menuRef}
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

  li + li {
    padding-inline: 1rem; /* give space among li tags */
  }

  li[role="none"] {
    display: flex;
    padding-inline: 0.6rem;
    cursor: default;
    position: relative;
  }

  li[role="none"].is-open {
    background-color: var(--color-border-base);
    border-radius: 2px;
  }

  :global(.menubar-menu-position) {
    top: 1.75rem;
    position: absolute;
    left: 0;
  }
</style>