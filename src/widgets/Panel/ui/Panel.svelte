<script lang="ts">
  import { ResultsConsole } from '$widgets/ResultsConsole';
  import { DependencyWidget } from '$widgets/DependencyWidget';
</script>

<div class="l-panel__results-console">
  <ResultsConsole />
</div>
<DependencyWidget />

<style>
  .l-panel__results-console {
    display: flex;
    flex-direction: column;
    flex: 2;
    min-height: 0;
  }
</style>
