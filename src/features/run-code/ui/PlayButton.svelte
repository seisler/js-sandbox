<script lang="ts">
  import PlayIcon from '$shared/ui/icons/PlayIcon.svelte';
  import Button from '$shared/ui/Button/Button.svelte';
  import type { PlayButtonProps } from './PlayButton.type';
  import { runCode } from '../api/runCode';

  let { isDisabled }: PlayButtonProps = $props();
</script>

<Button
  aria-label="Run code"
  align="center"
  disabled={isDisabled}
  onclick={runCode}
  variant="normal"
>
  <PlayIcon />
</Button>