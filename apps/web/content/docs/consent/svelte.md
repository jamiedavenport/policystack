---
title: "@policystack/svelte/consent"
description: "Svelte 5 runes adapter, with a Svelte 4 Readable fallback"
product: consent
---

Svelte adapter for Consent. Runes-first for Svelte 5; ships a `Readable<ConsentState>` fallback at `@policystack/svelte/consent/stores` for Svelte 4. Wraps [`@policystack/core/consent`](/docs/consent/core).

## Install

```sh
bun add @policystack/core/consent @policystack/svelte/consent
```

Peer dependencies: `svelte >= 4`.

## Setup (Svelte 5 runes)

Call `setPolicyStackConsentContext` once in a root component (e.g., `+layout.svelte` for SvelteKit):

```svelte
<script lang="ts">
  import { setPolicyStackConsentContext } from "@policystack/svelte/consent";
  import type { Category } from "@policystack/core/consent";

  const categories: Category[] = [
    { key: "essential", label: "Essential", locked: true },
    { key: "analytics", label: "Analytics" },
    { key: "marketing", label: "Marketing" },
  ];

  setPolicyStackConsentContext({ config: { categories } });

  let { children } = $props();
</script>

{@render children?.()}
```

You can pass a pre-created store with `setPolicyStackConsentContext({ store })` instead.

## API

### `getConsent()`

Returns a reactive object whose properties are tracked via `$state`. Read directly in markup — no destructuring required to keep reactivity.

```svelte
<script lang="ts">
  import { getConsent } from "@policystack/svelte/consent";

  const consent = getConsent();
</script>

{#if consent.route === "cookie"}
  <div class="banner">
    <button onclick={consent.acceptNecessary}>Necessary only</button>
    <button onclick={consent.acceptAll}>Accept all</button>
    <button onclick={() => consent.setRoute("preferences")}>Customize</button>
  </div>
{/if}
```

### `getCategory(key)`

Granular per-category access.

```svelte
<script lang="ts">
  import { getCategory } from "@policystack/svelte/consent";

  const analytics = getCategory("analytics");
</script>

<label>
  <input type="checkbox" checked={analytics.granted} onchange={analytics.toggle} />
  Analytics
</label>
```

### `<ConsentGate>`

Renders the `children` snippet when an expression is satisfied; renders `fallback` snippet otherwise.

```svelte
<script lang="ts">
  import { ConsentGate } from "@policystack/svelte/consent";
  import Chart from "./Chart.svelte";
  import EnablePrompt from "./EnablePrompt.svelte";
</script>

<ConsentGate requires="analytics">
  {#snippet children()}
    <Chart />
  {/snippet}
  {#snippet fallback()}
    <EnablePrompt />
  {/snippet}
</ConsentGate>

<ConsentGate requires={{ and: ["analytics", "marketing"] }}>
  {#snippet children()}
    <PersonalizedPromo />
  {/snippet}
</ConsentGate>
```

## SvelteKit (SSR + hydration)

Call `setPolicyStackConsentContext` from your root layout. It uses Svelte's `setContext`, so it hydrates safely:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { setPolicyStackConsentContext } from "@policystack/svelte/consent";
  import { categories } from "$lib/cookies";

  setPolicyStackConsentContext({ config: { categories } });

  let { children } = $props();
</script>

{@render children()}
```

## Svelte 4 stores fallback

For Svelte 4 codebases (or when you prefer `$store` syntax), import from the `/stores` subpath:

```svelte
<script>
  import { createConsentReadable } from "@policystack/svelte/consent/stores";

  const consent = createConsentReadable({
    config: { categories: [/* ... */] },
  });

  $: route = $consent.route;
</script>

{#if route === "cookie"}
  <button on:click={consent.acceptAll}>Accept all</button>
{/if}
```

`createConsentReadable` returns a `Readable<ConsentState>` augmented with the same action methods as `getConsent()` (`acceptAll`, `toggle`, `save`, `has`, etc.).

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating (`gateScript`), and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the Svelte adapter is a thin reactivity wrapper. A working example is in [`examples/svelte`](../../examples/svelte/).

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — React, Vue, Solid

## License

Apache-2.0
