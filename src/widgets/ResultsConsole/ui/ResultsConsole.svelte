<script lang="ts">
  import { PlayButton } from '$features/run-code';
  import { editorState } from '$shared/model';
</script>

<PlayButton
  isDisabled={editorState.isRunning}
/>
<section class="l-result c-result">
  Result: { editorState.result }
</section>
<section class="l-console c-console">
</section>

<style>
  .c-result, .c-console {
    padding-inline: 1rem;
    padding-block: 1em;
  }

  .c-result {
    border-bottom: 0.5px solid var(--clr-border);
  }

  .l-result {
    height: 45%;
  }

  .l-console {
    height: 45%;
  }
</style>