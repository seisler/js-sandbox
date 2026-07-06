<script lang="ts">
  import { packageBindingsState } from '$shared/model';
  import { Button } from '$shared/ui/Button';
  import { searchPackages, type PackageSearchResult } from '../api/searchPackages';
  import { pickerStatus, type SearchRequestState } from '../lib/picker';
  import { deriveDefaultAlias } from '../lib/deriveDefaultAlias';
  import { debounce } from '../lib/debounce';
  import {
    PACKAGE_MANAGER_MESSAGES,
    PACKAGE_SEARCH_DEBOUNCE_MS,
    noMatchMessage,
  } from '../config/messages.config';

  let { open = false, onclose }: { open?: boolean; onclose: () => void } = $props();

  let dialogRef = $state<HTMLDialogElement>();
  let searchInputRef = $state<HTMLInputElement>();
  let query = $state('');
  let requestState = $state<SearchRequestState>('success');
  let results = $state<PackageSearchResult[]>([]);

  const status = $derived(
    pickerStatus(query, requestState, results, packageBindingsState.packages),
  );

  const runSearch = debounce((searched: string) => {
    if (searched.trim() === '') {
      requestState = 'success';
      results = [];
      return;
    }

    requestState = 'loading';
    searchPackages(searched)
      .then((found) => {
        if (searched !== query) return; // ignore a superseded query's response
        results = found;
        requestState = 'success';
      })
      .catch(() => {
        if (searched !== query) return;
        requestState = 'error';
      });
  }, PACKAGE_SEARCH_DEBOUNCE_MS);

  $effect(() => {
    if (!dialogRef) return;
    if (open && !dialogRef.open) {
      dialogRef.showModal();
      query = '';
      results = [];
      requestState = 'success';
      searchInputRef?.focus();
    } else if (!open && dialogRef.open) {
      dialogRef.close();
    }
  });

  function handleInput(event: Event): void {
    query = (event.currentTarget as HTMLInputElement).value;
    runSearch(query);
  }

  function handleSelect(result: PackageSearchResult): void {
    packageBindingsState.addPackage({
      package: result.name,
      alias: deriveDefaultAlias(result.name),
    });
    onclose();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') onclose();
  }

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target === dialogRef) onclose();
  }
</script>

<dialog
  class="c-package-manager__modal"
  bind:this={dialogRef}
  onclose={onclose}
  onkeydown={handleKeyDown}
  onclick={handleBackdropClick}
>
  <header class="c-package-manager__modal-header">
    <h3 class="c-package-manager__modal-title">{PACKAGE_MANAGER_MESSAGES.modalTitle}</h3>
    <Button variant="ghost" aria-label="Close" onclick={onclose}>✕</Button>
  </header>

  <input
    bind:this={searchInputRef}
    class="c-package-manager__modal-search"
    type="search"
    placeholder="Search packages…"
    aria-label="Search packages"
    autocomplete="off"
    value={query}
    oninput={handleInput}
  />

  {#if status.kind === 'results'}
    <ul class="c-package-manager__modal-list">
      {#each status.items as result (result.name)}
        <li>
          <Button
            variant="ghost"
            align="start"
            class="c-package-manager__modal-item"
            onclick={() => handleSelect(result)}
          >
            <span class="c-package-manager__result-name">{result.name}</span>
            <span class="c-package-manager__result-alias">({deriveDefaultAlias(result.name)})</span>
            {#if result.description}
              <span class="c-package-manager__result-desc">{result.description}</span>
            {/if}
          </Button>
        </li>
      {/each}
    </ul>
  {:else if status.kind === 'loading'}
    <p class="c-package-manager__modal-loading">{PACKAGE_MANAGER_MESSAGES.pickerLoading}</p>
  {:else if status.kind === 'error'}
    <p class="c-package-manager__modal-error" role="alert">{PACKAGE_MANAGER_MESSAGES.pickerError}</p>
  {:else if status.kind === 'no-match'}
    <p class="c-package-manager__empty-picker">{noMatchMessage(status.query)}</p>
  {:else}
    <p class="c-package-manager__empty-picker">{PACKAGE_MANAGER_MESSAGES.pickerIdle}</p>
  {/if}
</dialog>

<style>
  .c-package-manager__modal {
    width: 320px;
    padding: var(--space-4);
    border: none;
    border-radius: var(--radius-sm);
    background-color: var(--clr-bg-main);
    color: var(--clr-txt-main);
    box-shadow: var(--shadow-elevated);
  }

  .c-package-manager__modal::backdrop {
    backdrop-filter: blur(2px);
  }

  .c-package-manager__modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--space-4);
  }

  .c-package-manager__modal-title {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  .c-package-manager__modal-search {
    width: 100%;
    margin-block-end: var(--space-2);
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--clr-txt-main);
    background-color: var(--clr-bg-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--radius-sm);
    padding-inline: var(--space-2);
    padding-block: var(--space-2);
  }

  .c-package-manager__modal-search:focus {
    outline: 1px solid var(--clr-brand);
  }

  .c-package-manager__modal-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  :global(.c-package-manager__modal-item) {
    width: 100%;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding-inline: var(--space-2);
    padding-block: var(--space-2);
    border-radius: var(--radius-sm);
    background-color: transparent;
  }

  :global(.c-package-manager__modal-item:hover) {
    background-color: var(--clr-border);
  }

  .c-package-manager__result-name {
    font-family: var(--font-family-mono);
  }

  .c-package-manager__result-alias {
    color: var(--clr-txt-muted);
    font-family: var(--font-family-mono);
  }

  .c-package-manager__result-desc {
    flex-basis: 100%;
    color: var(--clr-txt-muted);
    font-size: var(--font-size-xs);
  }

  .c-package-manager__empty-picker,
  .c-package-manager__modal-loading {
    color: var(--clr-txt-muted);
    font-size: var(--font-size-xs);
  }

  .c-package-manager__modal-error {
    color: var(--clr-txt-error);
    font-size: var(--font-size-xs);
  }
</style>
