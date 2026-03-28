<script lang="ts">
  import type { FormFieldProps } from './FormField.type';

  let { id, children, error, label, subLabel }: FormFieldProps = $props()
</script>

<label class="c-form-field__label" for={id}>
  <strong>{label}</strong>
  <small>{subLabel}</small>
</label>

{@render children()}

{#if error}
  <output role="alert" class="c-form-field__error">{error}</output>
{/if}

<style>
  .c-form-field__label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .c-form-field__error {
    color: var(--clr-txt-error)
  }
</style>