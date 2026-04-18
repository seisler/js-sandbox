<script lang="ts">
  import { Play } from '$shared/ui/icons';
  import { Button } from '$shared/ui/Button';
  import { runCode } from '../api/runCode';
  import { runCodeState } from '../model/RunCodeState.svelte.ts';
</script>

<Button
  aria-label="Run code"
  align="center"
  disabled={runCodeState.isRunning}
  onclick={runCode}
  variant="normal"
>
  <Play />
</Button>