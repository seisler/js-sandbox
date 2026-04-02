<script lang="ts">
  import PlayButton from "./PlayButton.svelte";

  function handleOnPlayClick(e: any & { currentTarget: HTMLButtonElement }) {
    // execute the code in a V8 JS VM.
  }
</script>

<PlayButton onclick={handleOnPlayClick} />
<section class="l-result c-result">
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