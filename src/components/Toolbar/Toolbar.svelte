<script lang="ts">
  import Button from '../ui/Button/Button.svelte';
  import Menu from '../ui/Menu/Menu.svelte';
  import { type EToolbarItem, menuConfig } from './Toolbar.config';
  import { preferencesState } from '../Preferences/Preferences.svelte.ts';

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
  class="c-toolbar"
  tabindex={-1}
>
  {#each Object.values(menuConfig) as { id, Icon, menuItems, label }}
    <li
      role="none"
      class="c-toolbar__item"
      class:c-toolbar__item--selected={currentMenuOpen === id}
    >
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
          class="c-toolbar__dropdown"
          ariaLabel={label}
          items={menuItems}
          bind:domRef={menuRef}
          onfocusout={handleOnFocusOut}
        />
      {/if}
    </li>
  {/each}
</ul>

<style>
  .c-toolbar {
    display: flex;
    list-style: none;
    align-items: end;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  .c-toolbar__item {
    /* em because of block padding is affected by text size, should be attached to parent font-size */
    padding-block: 0.8em;
    /* ensure menu items text does not brake line */ 
    white-space: nowrap;
    overflow: hidden;
    cursor: pointer;
  }

  .c-toolbar__item--selected {
    background-color: var(--clr-border);
  }

  :global(.c-toolbar__dropdown) {
    position: absolute;
    left: 2rem;
    bottom: 3.2rem;
  }
</style>