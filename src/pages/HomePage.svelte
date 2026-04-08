<script lang="ts">
  import { Editor } from '$widgets/Editor';
  import { ResultsConsole } from '$widgets/ResultsConsole';
</script>

<section class="l-editor">
  <Editor />
</section>
<aside class="l-console c-console">
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

  .l-editor {
    width: 70%;
  }

  .l-console {
    display: flex;
    flex-direction: column;
    padding-left: 0.2rem;
    width: 40%;
  }

  .c-console {
    color: var(--clr-txt-main);
    background-color: var(--clr-bg-main);
  }
</style>
