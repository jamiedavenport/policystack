<script lang="ts">
  import type { ScriptDefinition, ScriptEvent } from "@policystack/core/consent";
  import { gateScript } from "@policystack/core/consent";
  import { untrack } from "svelte";
  import { getConsent } from "./context.svelte";

  type Props = {
    def: ScriptDefinition;
    onEvent?: (event: ScriptEvent) => void;
  };

  let { def, onEvent }: Props = $props();

  const consent = getConsent();
  const id = $derived(def.id);

  // `$effect` is client-only and its teardown runs before an ID-driven re-gate
  // and when the component is destroyed. The derived primitive keeps a fresh
  // inline definition with the same ID from restarting the gate.
  $effect(() => {
    void id;
    return untrack(() =>
      gateScript(consent._store(), def, {
        onEvent: (event) => onEvent?.(event),
      }),
    );
  });
</script>
