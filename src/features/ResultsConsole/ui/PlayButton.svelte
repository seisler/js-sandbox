<script lang="ts">
  import PlayIcon from './PlayIcon.svelte';
  import Button from '$shared/ui/Button/Button.svelte';

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