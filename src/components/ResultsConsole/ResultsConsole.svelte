<script lang="ts">
  import PlayButton from "./components/PlayButton/PlayButton.svelte";

  function handleOnPlayClick(e: any & { currentTarget: HTMLButtonElement }) {
    // execute the code in a V8 JS VM.
  }
</script>

<PlayButton onclick={handleOnPlayClick} />
<section class="result">
</section>
<section class="console">
</section>

<style>
  .result, .console {
    padding-inline: 1rem;
    padding-block: 1em;
  }

  .result {
    height: 45%;
    border-bottom: 0.5px solid var(--clr-border);
  }

  .console {
    height: 45%;
  }
</style>