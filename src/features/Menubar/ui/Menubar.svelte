<script lang="ts">
  import Button from '$shared/ui/Button/Button.svelte';
  import Menu from '$shared/ui/Menu/Menu.svelte';
  import { menuConfig } from '../config/Menubar.config';
  import type { CurrentMenuItem } from '../model/Menubar.type';

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

<ul role="menubar" aria-label="Actions menu" class="c-menubar">
  {#each Object.values(menuConfig) as menubarItem}
    <li
      role="none"
      class="c-menubar__item"
      class:c-menubar__item--open={currentItemMenuOpened === menubarItem.id}
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
        class="c-menubar__button"
      >
        {menubarItem.label}
      </Button>

      {#if currentItemMenuOpened ===  menubarItem.id}
        <Menu
          id={`actionsbar-menu-${menubarItem.id}`}
          class="c-menubar__dropdown c-menubar__button"
          onfocusout={handleOnFocusOut}
          ariaLabel={`${menubarItem.id} option menu`}
          items={menubarItem.menuItems || []}
          bind:domRef={menuRef}
        />
      {/if}
    </li>
  {/each}
</ul>

<style>
  .c-menubar {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .c-menubar__item + .c-menubar__item {
    /* give space among li tags */
    padding-inline: 1rem;
  }

  .c-menubar__item {
    display: flex;
    padding-inline: 0.6rem;
    cursor: default;
    position: relative;
  }

  .c-menubar__item--open {
    background-color: var(--clr-border);
    border-radius: 2px;
  }

  :global(.c-menubar__dropdown) {
    top: 1.75rem;
    position: absolute;
    left: 0;
  }

  :global(.c-menubar__button) {
    width: 100% !important;
  }
</style>