<script lang="ts">
  import { packageBindingsState } from '$shared/model';
  import { Button } from '$shared/ui/Button';
  import { isAliasValid } from '../lib/alias';
  import { PACKAGE_MANAGER_MESSAGES } from '../config/messages.config';

  // Draft alias values keyed by package name. A draft diverges from the
  // committed binding only while it is invalid (empty), which the shared state
  // rejects — so we hold the in-progress text here to keep the input editable
  // and drive the inline error without ever committing an empty alias.
  let drafts = $state<Record<string, string>>({});

  function aliasValue(packageName: string, committed: string): string {
    return drafts[packageName] ?? committed;
  }

  function handleAliasInput(packageName: string, event: Event): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    drafts = { ...drafts, [packageName]: value };

    if (isAliasValid(value)) {
      packageBindingsState.updateAlias(packageName, value);
    }
  }

  function handleRemove(packageName: string): void {
    packageBindingsState.removePackage(packageName);
  }
</script>

<ul class="c-package-manager__list">
  {#each packageBindingsState.packages as binding (binding.package)}
    {@const alias = aliasValue(binding.package, binding.alias)}
    {@const invalid = !isAliasValid(alias)}
    <li class="c-package-manager__item">
      <span class="c-package-manager__name">{binding.package}</span>

      <div class="c-package-manager__alias-field">
        <label class="c-package-manager__alias-label" for="alias-{binding.package}">
          {PACKAGE_MANAGER_MESSAGES.aliasLabel}
        </label>
        <input
          id="alias-{binding.package}"
          class="c-package-manager__alias-input"
          class:c-package-manager__alias-input--invalid={invalid}
          type="text"
          value={alias}
          oninput={(event) => handleAliasInput(binding.package, event)}
        />
      </div>

      <Button variant="ghost" aria-label="Remove {binding.package}" onclick={() => handleRemove(binding.package)}>
        ✕
      </Button>

      {#if invalid}
        <output role="alert" class="c-package-manager__alias-error">
          {PACKAGE_MANAGER_MESSAGES.aliasError}
        </output>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .c-package-manager__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .c-package-manager__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    padding: var(--space-2);
    background-color: var(--clr-bg-main);
    border-radius: var(--radius-sm);
  }

  .c-package-manager__name {
    flex: 1;
    font-family: var(--font-family-mono);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .c-package-manager__alias-field {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .c-package-manager__alias-label {
    color: var(--clr-txt-muted);
    font-size: var(--font-size-xs);
  }

  .c-package-manager__alias-input {
    width: 5rem;
    line-height: 1.4;
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    color: var(--clr-txt-main);
    background-color: var(--clr-bg-surface);
    border: 1px solid var(--clr-border);
    border-radius: var(--radius-sm);
    padding-inline: var(--space-2);
    padding-block: var(--space-2);
  }

  .c-package-manager__alias-input--invalid {
    border-color: var(--clr-txt-error);
  }

  .c-package-manager__alias-error {
    flex-basis: 100%;
    color: var(--clr-txt-error);
    font-size: var(--font-size-xs);
  }
</style>
