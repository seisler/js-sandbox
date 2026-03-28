<script lang="ts">
  
  import { z } from 'zod';
  import { EditorPreferencesSchema } from './EditorPreferencesForm.schema';
  import FormField from './components/FormField.svelte';

  /* ---- State & Props ---- */

  let formData = $state({
    fontFamily: 'fira-code',
    fontSize: 14,
    theme: 'vs-dark',
    cursor: 'block',
    language: 'javascript',
  });

  let validation = $derived(EditorPreferencesSchema.safeParse(formData));

  let errors = $derived(
    validation.success ? {} : z.treeifyError(validation.error).properties
  );

  /* ---- Javascript ---- */

  function submitForm(e: Event) {
    e.preventDefault();
    if (validation.success) {
      // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
      //greetMsg = await invoke("greet", { name });
      console.log('Form valid, should call Rust at this point');
    }
  }
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
      class="c-editor-preferences-form__item c-editor-preferences-form__select"
      bind:value={formData.theme}
      onchange={submitForm}
    >
      <option value="vs">Light</option>
      <option value="vs-dark">Dark</option>
      <option value="hc-black">High Contrast Dark</option>
      <option value="hc-light">High Contrast Light</option>
    </select>
  </FormField>

  <FormField
    id="cursor"
    label="Cursor"
    subLabel="Change the cursor of the editor"
    error={errors?.cursor ? errors.cursor.errors[0] : ""}
  >
    <select id="cursor" name="cursor" class="c-editor-preferences-form__item c-editor-preferences-form__select" bind:value={formData.cursor}>
      <option value="block">Block</option>
      <option value="line">Line</option>
      <option value="underline">Underline</option>
    </select>
  </FormField>

  <FormField
    id="font-family"
    label="Font Family"
    subLabel="Change the font family of the editor"
    error={errors?.fontFamily ? errors.fontFamily.errors[0] : ""}
  >
    <select id="font-family" name="fontFamily" class="c-editor-preferences-form__item c-editor-preferences-form__select" bind:value={formData.fontFamily}>
      <option value="fira-code">Fira Code, monospace</option>
      <option value="jetbrains-mono">JetBrains Mono, monospace</option>
      <option value="source-code-pro">Source Code Pro, monospace</option>
    </select>
  </FormField>

  <FormField
    id="font-size"
    label="Font Size"
    subLabel="Change the font size of the editor in pixels. Max 20px, Min 9px"
    error={errors?.fontSize ? errors.fontSize.errors[0] : ""}
  >
    <input type="number" id="font-size" name="fontSize" max={20} min={9} class="c-editor-preferences-form__item" bind:value={formData.fontSize} />
  </FormField>

  <FormField
    id="language"
    label="Language"
    subLabel="Change the code language of the editor"
    error={errors?.language ? errors.language.errors[0] : ""}
  >
    <select id="language" name="language" class="c-editor-preferences-form__item c-editor-preferences-form__select" bind:value={formData.language}>
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
    background-image: url('../../../assets/chevron-down-right.svg');
    background-repeat: no-repeat;
    background-position: right 0.7rem center;
    background-size: 1rem;
  }
</style>