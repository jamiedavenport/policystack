<script lang="ts">
  import type { ConsentExpr, ConsentStore, PolicyStackConsentConfig } from "@policystack/core/consent";
  import ConsentGate from "../lib/consent/ConsentGate.svelte";
  import { getCategory, getConsent, setPolicyStackConsentContext } from "../lib/consent/context.svelte";

  type Props = {
    config?: PolicyStackConsentConfig;
    store?: ConsentStore;
    requires?: ConsentExpr;
    withFallback?: boolean;
  };

  let { config, store, requires, withFallback = true }: Props = $props();

  if (store) setPolicyStackConsentContext({ store });
  else if (config) setPolicyStackConsentContext({ config });

  const consent = getConsent();
  const analytics = getCategory("analytics");
</script>

<span data-testid="route">{consent.route}</span>
<span data-testid="analytics-granted">{analytics.granted}</span>
<span data-testid="decided-at">{consent.decidedAt ?? "null"}</span>
<span data-testid="record-source">{consent.getConsentRecord()?.source ?? "null"}</span>
<span data-testid="record-schema">{consent.getConsentRecord()?.schemaVersion ?? "null"}</span>

{#if requires !== undefined}
  {#if withFallback}
    <ConsentGate {requires}>
      {#snippet children()}
        <span data-testid="child">visible</span>
      {/snippet}
      {#snippet fallback()}
        <span data-testid="fb">nope</span>
      {/snippet}
    </ConsentGate>
  {:else}
    <ConsentGate {requires}>
      {#snippet children()}
        <span data-testid="child">visible</span>
      {/snippet}
    </ConsentGate>
  {/if}
{/if}
