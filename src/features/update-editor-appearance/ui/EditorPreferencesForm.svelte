<script lang="ts">
  import { z } from 'zod';
  import {
    userEditorAppearanceState,
    Cursor,
    FontFamily,
    Theme,
    EditorPreferencesSchema
  } from '$entities/editor';
  import FormField from './FormField.svelte';

  let validation = $derived(EditorPreferencesSchema.safeParse(userEditorAppearanceState));
  let errors = $derived(validation.success ? {} : z.treeifyError(validation.error).properties);
</script>

<form class="c-editor-preferences-form">
  <FormField
    id="theme"
    label="Theme"
    subLabel="Change the Theme of the editor"
    error={errors?.theme ? errors.theme.errors[0] : ""}
  >
    <select
      id="theme"
      name="theme"
      bind:value={userEditorAppearanceState.theme}
      class="c-editor-preferences-form__item c-editor-preferences-form__select"
    >
      <option value={Theme.Vs}>Light</option>
      <option value={Theme.VsDark}>Dark</option>
      <option value={Theme.HcBlack}>High Contrast Dark</option>
      <option value={Theme.HcLight}>High Contrast Light</option>
    </select>
  </FormField>

  <FormField
    id="cursor"
    label="Cursor"
    subLabel="Change the cursor of the editor"
    error={errors?.cursor ? errors.cursor.errors[0] : ""}
  >
    <select
      id="cursor"
      name="cursor"
      bind:value={userEditorAppearanceState.cursor}
      class="c-editor-preferences-form__item c-editor-preferences-form__select"
    >
      <option value={Cursor.Block}>Block</option>
      <option value={Cursor.Line}>Line</option>
      <option value={Cursor.Underline}>Underline</option>
    </select>
  </FormField>

  <FormField
    id="font-family"
    label="Font Family"
    subLabel="Change the font family of the editor"
    error={errors?.fontFamily ? errors.fontFamily.errors[0] : ""}
  >
    <select
      id="font-family"
      name="fontFamily"
      bind:value={userEditorAppearanceState.fontFamily}
      class="c-editor-preferences-form__item c-editor-preferences-form__select"
    >
      <option value={FontFamily.FiraCode}>Fira Code, monospace</option>
      <option value={FontFamily.JetbrainsMono}>Jetbrains Mono</option>
      <option value={FontFamily.SourceCodePro}>Source Code Pro</option>
    </select>
  </FormField>

  <FormField
    id="font-size"
    label="Font Size"
    subLabel="Change the font size of the editor in pixels. Max 20px, Min 9px"
    error={errors?.fontSize ? errors.fontSize.errors[0] : ""}
  >
    <input
      type="number"
      id="font-size"
      name="fontSize"
      max={20}
      min={9}
      bind:value={userEditorAppearanceState.fontSize}
      class="c-editor-preferences-form__item" />
  </FormField>

  <FormField
    id="language"
    label="Language"
    subLabel="Change the code language of the editor"
    error={errors?.language ? errors.language.errors[0] : ""}
  >
    <select
      id="language"
      name="language"
      bind:value={userEditorAppearanceState.language}
      class="c-editor-preferences-form__item c-editor-preferences-form__select">
      <option value="javascript">Javascript</option>
      <option value="typescript">Typescript</option>
    </select>
  </FormField>
</form>

<style>
  .c-editor-preferences-form {
    color: var(--clr-txt-main);
    display: flex;
    gap: 1.5rem;
    flex-direction: column;
    width: 100%;
  }

  .c-editor-preferences-form__item {
    color: var(--clr-txt-contrast);
    width: 50%;
    min-height: 2rem;
    appearance: none;
    -webkit-appearance: none;
    border: none;
    margin: 0;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    /* Remove the blue 'glow' on focus (Careful with accessibility!) */
    outline: none;
    border-radius: 2px;
    text-indent: 0.5rem;
  }

  .c-editor-preferences-form__select {
    appearance: none;
    background-image: url('$shared/ui/assets/chevron-down-right.svg');
    background-repeat: no-repeat;
    background-position: right 0.7rem center;
    background-size: 1rem;
  }
</style>