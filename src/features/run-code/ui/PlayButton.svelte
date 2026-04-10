<script lang="ts">
  import PlayIcon from '$shared/ui/icons/PlayIcon.svelte';
  import Button from '$shared/ui/Button/Button.svelte';
  import type { PlayButtonProps } from './PlayButton.type';

  let { onclick, isDisabled }: PlayButtonProps = $props();
</script>

<Button
  aria-label="Run code"
  align="center"
  disabled={isDisabled}
  {onclick}
  variant="normal"
>
  <PlayIcon />
</Button>