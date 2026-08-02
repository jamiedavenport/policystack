<script lang="ts">
  import type { ConsentStore, ScriptDefinition, ScriptEvent } from "@policystack/core/consent";
  import { untrack } from "svelte";
  import GatedScript from "../lib/consent/GatedScript.svelte";
  import { setPolicyStackConsentContext } from "../lib/consent/context.svelte";

  type Props = {
    store: ConsentStore;
    def: ScriptDefinition;
    onEvent?: (event: ScriptEvent) => void;
    mounted?: boolean;
    secondDef?: ScriptDefinition;
  };

  let { store, def, onEvent, mounted = true, secondDef }: Props = $props();

  setPolicyStackConsentContext({ store: untrack(() => store) });
</script>

{#if mounted}
  <GatedScript {def} {onEvent} />
{/if}

{#if secondDef}
  <GatedScript def={secondDef} {onEvent} />
{/if}
