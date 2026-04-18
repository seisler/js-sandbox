<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
  import * as monaco from 'monaco-editor';
  import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
  import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
  import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
  import {
    editorState,
    editorDefaultAppearance,
    userEditorAppearanceState
  } from '$entities/editor';

  let editorContainer: HTMLDivElement;
  let editorInstance: monaco.editor.IStandaloneCodeEditor;
	
	onMount(() => {
    /* Monaco environment must be set on global object. */
    self.MonacoEnvironment = {
      getWorker: function (_, label) {
        if (label === 'json') return new jsonWorker();
        if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
        if (label === 'typescript' || label === 'javascript') return new tsWorker();
        
        return new editorWorker();
      }
    };

    /* Merge User appearance preferences with defaults */
    const mergedAppearancePreferences = {...editorDefaultAppearance, ...userEditorAppearanceState};

    editorInstance = monaco.editor.create(editorContainer, mergedAppearancePreferences);

    editorInstance.onDidChangeModelContent(() => {
      editorState.code = editorInstance.getValue();
    });
  });

  $effect(() => {
    editorInstance?.updateOptions({
      fontFamily: userEditorAppearanceState.fontFamily,
      fontSize: userEditorAppearanceState.fontSize,
      theme: userEditorAppearanceState.theme,
      cursorStyle: userEditorAppearanceState.cursor,
    });
  });

  onDestroy(() => {
    if (editorInstance) editorInstance.dispose();
  });

</script>

<div bind:this={editorContainer} class="l-editor"></div>
	
<style>
  .l-editor {
    height: 100%;
  }
</style>
