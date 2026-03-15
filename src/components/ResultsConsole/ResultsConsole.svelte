<script lang="ts">
  import PlayButton from "./components/PlayButton/PlayButton.svelte";

  function handleOnPlayClick(e: any & { currentTarget: HTMLButtonElement }) {
    // execute the code in a V8 JS VM.
  }
</script>

<PlayButton onClick={handleOnPlayClick} />
<section class="result">
// here it comes the Result
</section>
<section class="console">
// here it comes the console
</section>

<style>
  .result, .console {
    padding-inline: 1rem;
    padding-block: 1em;
  }

  .result {
    height: 45%;
    border-bottom: 0.5px solid var(--color-border-base);
  }

  .console {
    height: 45%;
  }
</style>