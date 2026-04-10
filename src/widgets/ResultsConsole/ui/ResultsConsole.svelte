<script lang="ts">
  import { PlayButton, runCode } from '$features/run-code';
  import { editorState } from '$shared/model';

  async function handleOnPlayClick(
    _e: MouseEvent & { currentTarget: HTMLButtonElement }
  ) {
    runCode();
  }
</script>

<PlayButton
  onclick={handleOnPlayClick}
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