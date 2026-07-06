<script lang="ts">
  import { packageBindingsState } from '$shared/model';
  import { Button } from '$shared/ui/Button';
  import ActivePackageList from './ActivePackageList.svelte';
  import PackagePicker from './PackagePicker.svelte';
  import { PACKAGE_MANAGER_MESSAGES } from '../config/messages.config';

  let isPickerOpen = $state(false);

  function openPicker(): void {
    isPickerOpen = true;
  }

  function closePicker(): void {
    isPickerOpen = false;
  }
</script>

<section class="l-package-manager c-package-manager">
  <header class="c-package-manager__header">
    <h2 class="c-package-manager__title">{PACKAGE_MANAGER_MESSAGES.title}</h2>
    <Button variant="ghost" onclick={openPicker}>{PACKAGE_MANAGER_MESSAGES.addTrigger}</Button>
  </header>

  {#if packageBindingsState.packages.length === 0}
    <p class="c-package-manager__empty">{PACKAGE_MANAGER_MESSAGES.emptyList}</p>
  {:else}
    <ActivePackageList />
  {/if}
</section>

<PackagePicker open={isPickerOpen} onclose={closePicker} />

<style>
  .l-package-manager {
    flex: 1;
    min-height: 0;
  }

  .c-package-manager {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-inline: var(--space-4);
    padding-block: var(--space-4);
    background-color: var(--clr-bg-surface);
    color: var(--clr-txt-main);
    font-size: var(--font-size-sm);
    border-top: 0.5px solid var(--clr-border);
  }

  .c-package-manager__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  .c-package-manager__title {
    font-size: var(--font-size-lg);
    margin: 0;
  }

  .c-package-manager__empty {
    color: var(--clr-txt-muted);
    font-size: var(--font-size-xs);
  }
</style>
