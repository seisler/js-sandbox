<script lang="ts">
  import Button from '../ui/Button/Button.svelte';
  import Menu from '../ui/Menu/Menu.svelte';
  import { EMenubarItem, menuConfig } from './Menubar.config';

  /* ---- Typescript ---- */

  type CurrentMenuItem = EMenubarItem | null;

  /* ---- State & Props ---- */

  let currentItemMenuOpened: CurrentMenuItem = $state(null);
  let menuRef: HTMLUListElement | undefined = $state();

  $effect(() => {
    if (currentItemMenuOpened && menuRef) {
      menuRef.focus();
    }
  })

  /* ---- Javascript ----*/
  
  /**
   * Unset currentItemMenuOpened state
   * to remove opened menu from DOM on focus lost.
   */
  function handleOnFocusOut(e: FocusEvent & { currentTarget: HTMLUListElement }) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      currentItemMenuOpened = null;
    }
  }
</script>

<ul role="menubar" aria-label="Actions menu">
  {#each Object.values(menuConfig) as menubarItem}
    <li
      role="none"
      class:is-open={currentItemMenuOpened === menubarItem.id}
    >
      <Button
        id={`actionsbar-item-${menubarItem.id}`}
        role="menuitem"
        tabindex={0}
        variant="ghost"
        aria-haspopup="menu"
        aria-controls={`actionsbar-menu-${menubarItem.id}`}
        aria-expanded={currentItemMenuOpened === menubarItem.id}
        onclick={() => {currentItemMenuOpened = menubarItem.id}}
      >
        {menubarItem.text}
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
    /* give space among li tags */
    padding-inline: 1rem;
  }

  li[role="none"] {
    display: flex;
    padding-inline: 0.6rem;
    cursor: default;
    position: relative;
  }

  li[role="none"].is-open {
    background-color: var(--clr-border);
    border-radius: 2px;
  }

  :global(.menubar-menu-position) {
    top: 1.9rem;
    position: absolute;
    left: 0;
  }
</style>