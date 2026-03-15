<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
  import * as monaco from 'monaco-editor';
  import config from './config';
  import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
  import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
  import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

  let editorContainer: HTMLDivElement;
  let editorInstance: monaco.editor.IStandaloneCodeEditor;
	
	onMount(() => {
    // Monaco environment must be set on global object.
    self.MonacoEnvironment = {
      getWorker: function (_, label) {
        if (label === 'json') return new jsonWorker();
        if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
        if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
        if (label === 'typescript' || label === 'javascript') return new tsWorker();
        
        return new editorWorker();
      }
    };

    editorInstance = monaco.editor.create(editorContainer, config);

    // Wait until instance is fully loaded to scroll until line 3.
    setTimeout(() => {
      editorInstance.setPosition({ lineNumber: 3, column: 1 });
      editorInstance.focus();
      editorInstance.revealLine(3);
    }, 50);
  });

  onDestroy(() => {
    if (editorInstance) editorInstance.dispose();
  });

</script>

<div bind:this={editorContainer} class="editor"></div>
	
<style>
  .editor {
    font-size: 32px;
    height: 100%;
  }
</style>
