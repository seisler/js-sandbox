<script lang="ts">
  import PlayIcon from './icons/PlayIcon.svelte';
  import Button from '$components/ui/Button/Button.svelte';

  let { onclick } = $props();
</script>

<Button
  aria-label="Run code"
  align="center"
  {onclick}
  variant="normal"
>
  <PlayIcon />
</Button>