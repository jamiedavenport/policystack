---
title: "@policystack/vue/consent"
description: "Vue 3 adapter — provider, composables, ConsentGate, GatedScript"
product: consent
---

Vue 3 adapter for Consent. Bridges [`@policystack/core/consent`](/docs/consent/core) with Vue's reactivity via `shallowRef` and `computed`.

## Install

```sh
bun add @policystack/core @policystack/vue
```

Peer dependencies: `vue >= 3.4`.

## Setup

There is **one** provider. Wrap your app with `<PolicyStack>` from `@policystack/vue/provider` and pass it your whole `policystack.ts` config — it supplies both the policy context (`<PrivacyPolicy>` / `<CookiePolicy>`) and the consent store. The consent categories (and their locked vs. consent-gated state) are derived from `config.cookies`; there is no separate categories array, plugin, or conversion step.

```vue
<script setup lang="ts">
import { PolicyStack } from "@policystack/vue/provider";
import config from "./policystack";
</script>

<template>
	<PolicyStack :config="config">
		<App />
	</PolicyStack>
</template>
```

`useConsent` / `useCategory` / `useConsentStore` / `<ConsentGate>` / `<GatedScript>` (from `@policystack/vue/consent`) read the store from this same provider. A policy-only config (no `cookies`) provides no store, so a consent composable used under it throws — that is a configuration error, not a runtime state.

## API

### `useConsent()`

Returns reactive refs for the current consent state plus action methods. Use it inside `setup()` or any `<script setup>` block.

```vue
<script setup lang="ts">
import { useConsent } from "@policystack/vue/consent";

const { route, decisions, acceptAll, acceptNecessary, setRoute } = useConsent();
</script>

<template>
	<div v-if="route === 'cookie'">
		<button @click="acceptNecessary">Necessary only</button>
		<button @click="acceptAll">Accept all</button>
		<button @click="setRoute('preferences')">Customize</button>
	</div>
</template>
```

### `useCategory(key)`

Granular per-category access. Returns a `granted` computed and a `toggle` action.

`toggle` stages the change and `granted` reflects it instantly (it reads the pending `state.draft`), but nothing is applied — `has()`, `<ConsentGate>`, script gating, and storage only change when `save()` promotes the draft. Leaving the preferences route without saving discards it.

```vue
<script setup lang="ts">
import { useCategory } from "@policystack/vue/consent";

const { granted, toggle } = useCategory("analytics");
</script>

<template>
	<label>
		<input type="checkbox" :checked="granted" @change="toggle" />
		Analytics
	</label>
</template>
```

### `<ConsentGate>`

Renders the default slot when an expression is satisfied, optionally a `fallback` slot otherwise. The component itself emits no DOM wrapper.

```vue
<script setup lang="ts">
import { ConsentGate } from "@policystack/vue/consent";
import Chart from "./Chart.vue";
import EnablePrompt from "./EnablePrompt.vue";
</script>

<template>
	<ConsentGate requires="analytics">
		<Chart />
		<template #fallback>
			<EnablePrompt />
		</template>
	</ConsentGate>

	<ConsentGate :requires="{ and: ['analytics', 'marketing'] }">
		<PersonalizedPromo />
	</ConsentGate>
</template>
```

### `<GatedScript>`

Consent-gates one third-party script against the store from `<PolicyStack>`. It is the intended way to use the [`@policystack/scripts`](/docs/consent/scripts) catalogue from Vue.

```vue
<script setup lang="ts">
import { GatedScript } from "@policystack/vue/consent";
import { ga4 } from "@policystack/scripts/ga4";

const onScriptEvent = (event) => console.debug(event);
</script>

<template>
	<GatedScript :def="ga4({ measurementId: 'G-XXXXXXX' })" :on-event="onScriptEvent" />
</template>
```

The component renders no DOM and starts its gate after mount, so it is inert during SSR. Definitions can be built inline: a fresh object with the same `def.id` does not restart the gate or discard queued calls. Changing the ID disposes the old gate and starts the new one. `onEvent` receives `script:gated`, `script:queued`, and `script:loaded` events.

Core's [no-auto-revoke behavior](/docs/consent/core#no-auto-revoke) still applies: once loaded, a vendor script is not unloaded when consent changes or the component unmounts.

### `useConsentStore()`

Returns the stable, non-reactive `ConsentStore` from `<PolicyStack>` for core free functions such as `gateScripts`. Keep using `useConsent`, `useCategory`, or `<ConsentGate>` for reactive UI.

```ts
import { gateScripts } from "@policystack/core/consent";
import { useConsentStore } from "@policystack/vue/consent";

const store = useConsentStore();
const dispose = gateScripts(store, definitions);
```

Like the other consent composables, it throws outside `<PolicyStack>` or under a policy-only config.

## Options API

The composables are usable from Options API via `setup()`:

```vue
<script lang="ts">
import { defineComponent } from "vue";
import { useConsent, useCategory } from "@policystack/vue/consent";

export default defineComponent({
	setup() {
		const consent = useConsent();
		const analytics = useCategory("analytics");
		return { consent, analytics };
	},
});
</script>

<template>
	<button @click="consent.acceptAll()">Accept all</button>
	<input type="checkbox" :checked="analytics.granted" @change="analytics.toggle()" />
</template>
```

## Nuxt 3

Mount the single provider once around your app — e.g. in `app.vue` (or a layout):

```vue
<!-- app.vue -->
<script setup lang="ts">
import { PolicyStack } from "@policystack/vue/provider";
import config from "./policystack";
</script>

<template>
	<PolicyStack :config="config">
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</PolicyStack>
</template>
```

## Shared concepts

Categories, GPC handling, jurisdiction resolvers, re-consent triggers, script gating, and storage adapters all live in [`@policystack/core/consent`](/docs/consent/core) — the Vue adapter is a thin reactivity wrapper.

## See also

- [`@policystack/core/consent`](/docs/consent/core) — shared concepts and config reference
- [`@policystack/vite`](/docs/consent/vite) — build-time check for ungated cookie / vendor calls
- [Other adapters](../../#packages) — React, Solid, Svelte

## License

Apache-2.0
