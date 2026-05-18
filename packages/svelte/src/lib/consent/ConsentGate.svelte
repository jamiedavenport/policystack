<script lang="ts">
  import type { ConsentExpr } from "@policystack/core/consent";
  import type { Snippet } from "svelte";
  import { getConsent } from "./context.svelte";

  type Props = {
    requires: ConsentExpr;
    children?: Snippet;
    fallback?: Snippet;
  };

  let { requires, children, fallback }: Props = $props();

  const consent = getConsent();
  const active = $derived(consent.has(requires) ? children : fallback);
</script>

{#if active}
  {@render active()}
{/if}
