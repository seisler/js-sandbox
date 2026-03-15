<script lang="ts">
  import Editor from '../components/Editor/Editor.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import ResultsConsole from '../components/ResultsConsole/ResultsConsole.svelte';

  let name = $state("");
  let greetMsg = $state("");

  async function greet(event: Event) {
    event.preventDefault();
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsg = await invoke("greet", { name });
  }
</script>

<section class="editor">
  <Editor />
</section>
<aside class="console-container">
  <ResultsConsole />
</aside>

<style>
  :root {
    font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.2;
    font-weight: 400;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
  }

  .editor {
    width: 70%;
  }

  .console-container {
    color: var(--color-base);
    display: flex;
    flex-direction: column;
    padding-left: 0.2rem;
    width: 40%;
    background-color: var(--color-bg-base);
  }
</style>
