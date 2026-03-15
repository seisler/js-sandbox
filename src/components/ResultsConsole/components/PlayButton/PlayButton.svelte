<script lang="ts">
  import PlayIcon from './icons/PlayIcon.svelte';
  import Button from '../../../ui/Button/Button.svelte';

  let { onClick } = $props();
</script>

<Button
  ariaLabel="Run code"
  onClick={onClick}
  isTransparent={false}
>
  <PlayIcon />
</Button>

<style>
</style>