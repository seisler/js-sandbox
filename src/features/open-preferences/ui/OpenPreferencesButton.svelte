<script lang="ts">
  import { Button } from '$shared/ui/Button';
  import { preferencesDialogState } from '../model/PreferencesDialogState.svelte.ts';
  
  let { children, ...props } = $props();

  function handleOnClick() {
    preferencesDialogState.open()
  }
</script>

<Button
  onclick={handleOnClick}
  {...props}
> 
  {@render children?.()}
</Button>